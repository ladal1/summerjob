from __future__ import annotations

import logging
import time
import uuid
from typing import Any

import pandas as pd
from pulp import LpMinimize, LpProblem, lpSum, LpVariable
from sqlalchemy.orm import Session

from src import queries as q
from src.db import get_session
from src.parsing import parse_pg_array

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
BACKOFF_BASE = 2.0
COOCCURRENCE_PENALTY_WEIGHT = 1.0
ASSIGN_PENALTY = 1000.0
MIN_SHORTFALL_PENALTY = 100.0


# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------

def dictionarify(rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {str(row["id"]): dict(row) for row in rows}


def transform_score(rows: list[dict[str, Any]]) -> dict[tuple[str, str], Any]:
    return {(str(row["job"]), str(row["worker"])): row["score"] for row in rows}


def is_viable(
    worker: dict[str, Any],
    job: dict[str, Any],
    _attempt: int,
) -> bool:
    worker_allergies = parse_pg_array(worker.get("workAllergies"))
    job_allergens = parse_pg_array(job.get("allergens"))
    allergies_ok = set(worker_allergies).isdisjoint(set(job_allergens))
    adoration_ok = (
        (worker.get("isAdoring") and job.get("supportsAdoration"))
        or not worker.get("isAdoring")
    )
    return allergies_ok and adoration_ok


def what_workers(row: pd.Series, plan: dict[str, list[str]]) -> None:
    workers = [
        idx for idx, value in row.items()
        if hasattr(value, "varValue") and value.varValue > 0
    ]
    plan[row.name] = workers


# ---------------------------------------------------------------------------
# variable / constraint helpers
# ---------------------------------------------------------------------------

def add_variable(
    counter: int,
    driver: list[Any],
    first_round: bool,
    job: dict[str, Any],
    job_vars: dict[str, Any],
    strongman: list[Any],
    worker: str,
    workers: dict[str, dict[str, Any]],
    area_driver: dict[str, list[Any]],
    score: list[Any],
    scores: dict[tuple[str, str], Any],
) -> int:
    name = f"x{counter}"
    x = LpVariable(name, lowBound=0, upBound=1, cat="Binary")
    job_vars[worker] = x
    key = (str(job["id"]), worker)
    if key in scores:
        score.append(scores[key] * x)
    if first_round:
        if workers[worker].get("isStrong"):
            strongman.append(x)
        if workers[worker].get("isDriver") and job.get("requiresCar"):
            seats = workers[worker].get("seats", 0) or 0
            driver.append(seats * x)
            area_driver.setdefault(str(job["areaId"]), []).append(seats * x)
    return counter + 1


def restrict_pair(
    forbid: str,
    friend: str,
    job: Any,
    model: LpProblem,
    model_variables: pd.DataFrame,
) -> LpProblem:
    if forbid not in model_variables.columns or friend not in model_variables.columns:
        return model
    forbid_var = (
        model_variables.at[job, forbid]
        if not pd.isna(model_variables.at[job, forbid])
        else None
    )
    friend_var = (
        model_variables.at[job, friend]
        if not pd.isna(model_variables.at[job, friend])
        else None
    )
    if forbid_var is not None and friend_var is not None:
        model += forbid_var + friend_var <= 1
    return model


# ---------------------------------------------------------------------------
# data loading
# ---------------------------------------------------------------------------

def load(
    session: Session, plan_id: str, query: Any
) -> dict[str, dict[str, Any]]:
    result = session.execute(query, {"planId": plan_id})
    return dictionarify([dict(row._mapping) for row in result])


# ---------------------------------------------------------------------------
# save results
# ---------------------------------------------------------------------------

def save_to_db(
    res_dict: dict[str, list[str]],
    active_jobs: dict[str, dict[str, Any]],
    session: Session,
) -> None:
    for index, workers in res_dict.items():
        for worker in workers:
            session.execute(
                q.insert_plan,
                {"job": active_jobs[index]["activeJobId"], "worker": worker},
            )
    session.commit()


# ---------------------------------------------------------------------------
# plan generation (core solver)
# ---------------------------------------------------------------------------

def generate_plan(
    plan_id: str,
    session: Session,
    first_round: bool = True,
    attempt: int = 0,
) -> bool:
    jobs_raw = session.execute(q.select_jobs, {"planId": plan_id}).scalars().all()
    jobs = [str(x) for x in jobs_raw]

    job_properties = load(session, plan_id, q.select_job_details)
    workers = load(
        session, plan_id, q.select_strong_workers if first_round else q.select_workers
    )
    forbids = load(session, plan_id, q.select_forbids)

    active_jobs = load(session, plan_id, q.select_active_jobs)
    areas = load(session, plan_id, q.select_areas)

    scores_raw = session.execute(q.select_score, {"planId": plan_id})
    scores = transform_score([dict(row._mapping) for row in scores_raw])

    cooccurrence_raw = session.execute(q.select_cooccurrence, {"planId": plan_id})
    cooccurrence: dict[tuple[str, str], int] = {}
    for row in cooccurrence_raw:
        m = row._mapping
        a, b = str(m["worker_a"]), str(m["worker_b"])
        cooccurrence[(a, b)] = int(m["count"])

    model = LpProblem(name="Plan", sense=LpMinimize)
    model_variables = pd.DataFrame(columns=list(workers.keys()))
    score: list[Any] = []
    penalties: list[Any] = []
    counter = 0
    area_drivers: dict[str, list[Any]] = {area: [] for area in areas}

    for job in jobs:
        job_vars: dict[str, Any] = {}
        strongman: list[Any] = []
        driver: list[Any] = []
        for worker in workers:
            if is_viable(workers[worker], job_properties[job], attempt):
                counter = add_variable(
                    counter, driver, first_round, job_properties[job],
                    job_vars, strongman, worker, workers, area_drivers,
                    score, scores,
                )

        df_new_row = pd.DataFrame(
            [pd.Series(job_vars, name=job)], columns=model_variables.columns
        )
        model_variables = pd.concat([model_variables, df_new_row])

        max_workers = job_properties[job]["maxWorkers"]
        min_workers = job_properties[job]["minWorkers"]

        model += lpSum(job_vars.values()) <= max_workers
        if first_round:
            model += lpSum(strongman) >= job_properties[job]["strongWorkers"]
            if attempt < 1:
                model += lpSum(driver) >= job_properties[job]["neededCars"]
        else:
            shortfall = LpVariable(f"short_{job}", lowBound=0)
            model += lpSum(job_vars.values()) + shortfall >= min_workers
            penalties.append(MIN_SHORTFALL_PENALTY * shortfall)

    for worker in workers:
        assigned = lpSum(model_variables[worker].dropna().tolist())
        model += assigned <= 1
        penalties.append(ASSIGN_PENALTY * (1 - assigned))

    if attempt < 2:
        for forbid in forbids:
            friend = str(forbids[forbid]["forbid"])
            if friend in workers and forbid in workers:
                for job in jobs:
                    model = restrict_pair(forbid, friend, job, model, model_variables)

    if attempt > 0:
        for area in areas:
            model += lpSum(area_drivers[area]) >= areas[area]["requiredDrivers"]

    objective = lpSum(score) + lpSum(penalties)

    for (a, b), count in cooccurrence.items():
        if a not in workers or b not in workers:
            continue
        x_a_series = model_variables[a].dropna()
        x_b_series = model_variables[b].dropna()
        shared_jobs = x_a_series.index.intersection(x_b_series.index)
        for job in shared_jobs:
            p = LpVariable(f"s{job}_{a}_{b}", lowBound=0, upBound=1, cat="Binary")
            model += p <= x_a_series[job]
            model += p <= x_b_series[job]
            model += p >= x_a_series[job] + x_b_series[job] - 1
            objective += COOCCURRENCE_PENALTY_WEIGHT * count * p

    model += objective

    # -- debug summary --
    total_min = sum(
        job_properties[j]["minWorkers"] for j in jobs
    )
    total_max = sum(
        job_properties[j]["maxWorkers"] for j in jobs
    )
    logger.info(
        "Attempt %d | first_round=%s | workers=%d | jobs=%d | min=%d | max=%d"
        " | scores=%d | cooccurrence=%d | objective_terms=%d",
        attempt, first_round, len(workers), len(jobs), total_min, total_max,
        len(scores), len(cooccurrence), len(score),
    )

    status = model.solve()
    if status == -1:
        logger.warning(
            "Solver failed on attempt %d (first_round=%s)", attempt, first_round
        )
        return False

    logger.info("Solver succeeded on attempt %d (status=%s)", attempt, status)
    res_dict: dict[str, list[str]] = {}
    model_variables.apply(lambda v: what_workers(v, res_dict), axis=1)
    assigned_count = sum(len(ws) for ws in res_dict.values())
    logger.info(
        "Assigned %d/%d workers (%d unassigned)",
        assigned_count, len(workers), len(workers) - assigned_count,
    )
    save_to_db(res_dict, active_jobs, session)
    return True


# ---------------------------------------------------------------------------
# rides generation
# ---------------------------------------------------------------------------

def generate_rides(plan_id: str, session: Session) -> None:
    jobs_raw = session.execute(q.select_drive_jobs, {"planId": plan_id})
    jobs = [dict(row._mapping) for row in jobs_raw]

    for job_row in jobs:
        job_id = str(job_row["id"])
        drivers_raw = session.execute(
            q.select_driver, {"planId": job_id}
        )
        drivers = dictionarify([dict(row._mapping) for row in drivers_raw])

        people_raw = session.execute(
            q.select_people, {"planId": job_id}
        )
        people = [str(row._mapping["id"]) for row in people_raw]

        for d_id in list(drivers.keys()):
            if d_id in people:
                people.remove(d_id)

        sorted_drivers = sorted(
            drivers.items(), key=lambda x: x[1]["seats"], reverse=True
        )
        total_people = len(people)
        pointer = 0

        for driver_id, info in sorted_drivers:
            if pointer >= total_people:
                break
            available_seats = int(info["seats"]) - 1
            if pointer < total_people:
                ride = uuid.uuid4()
                session.execute(
                    q.insert_ride,
                    {
                        "uuid": ride,
                        "driver": driver_id,
                        "car": str(info["carId"]),
                        "job": job_id,
                    },
                )
                while available_seats > 0 and pointer < total_people:
                    session.execute(
                        q.insert_rider,
                        {"ride": ride, "worker": people[pointer]},
                    )
                    pointer += 1
                    available_seats -= 1

        session.commit()


# ---------------------------------------------------------------------------
# public entry point
# ---------------------------------------------------------------------------

def _solve_round(
    plan_id: str, session: Session, first_round: bool
) -> bool:
    for attempt in range(MAX_RETRIES):
        if generate_plan(plan_id, session, first_round=first_round, attempt=attempt):
            return True
        delay = BACKOFF_BASE ** attempt
        logger.warning(
            "Round %s attempt %d/%d failed, retrying in %.1fs",
            "first" if first_round else "second",
            attempt + 1, MAX_RETRIES, delay,
        )
        time.sleep(delay)
    logger.error(
        "Round %s failed after %d attempts",
        "first" if first_round else "second", MAX_RETRIES,
    )
    return False


def generate_plan_from_message(received_plan_id: str) -> None:
    with get_session() as session:
        if not _solve_round(received_plan_id, session, first_round=True):
            return
        if not _solve_round(received_plan_id, session, first_round=False):
            return
        generate_rides(received_plan_id, session)
        logger.info("Plan %s generated successfully", received_plan_id)
