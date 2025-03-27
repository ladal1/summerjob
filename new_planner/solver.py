import psycopg2
from psycopg2 import extras
from pulp import LpMinimize, LpProblem, lpSum, LpVariable
import pandas as pd
import uuid


from queries import *


def dictionarify(query_results):
    dictionary = {}
    for row in query_results:
        dictionary[row["id"]] = {**row}
    return dictionary


def transform_score(query_results):
    dictionary = {}
    for row in query_results:
        dictionary[(row["job"], row["worker"])] = row["score"]
    return dictionary


def is_viable(worker, job, forbidden, attempt):
    # allergens & adoration
    forbid = forbidden[worker["id"]] if worker["id"] in forbidden.keys() else []
    if not (set(worker["allergies"]).isdisjoint(job["allergens"]) and
            ((worker["isAdoring"] and job["supportsAdoration"]) or not
            worker["isAdoring"]) and
            (job not in forbidden or attempt > 1)):
        return True
    return False


def what_workers(row, plan):
    workers = []
    for index, value in row.items():
        if value.varValue > 0:
            workers.append(index)
    plan[row.name] = workers


def save_to_db(res_dict, active_jobs, cursor):
    for index, value in res_dict.items():
        for val in value:
            cursor.execute(insert_plan, {"job": active_jobs[index]["activeJobId"], "worker": val})


def generate_plan(plan_id, connection, first_round=True, attempt=0):
    dict_cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    primitive_cursor = connection.cursor()

    # Fetch all the records
    primitive_cursor.execute(select_jobs, {"planId": plan_id})
    jobs = list(map(lambda x: x[0], primitive_cursor.fetchall()))

    job_properties = load(dict_cursor, plan_id, select_job_details)
    workers = load(dict_cursor, plan_id, select_strong_workers if first_round else select_workers)
    forbids = load(dict_cursor, plan_id, select_forbids)
    forbidden_jobs = load(dict_cursor, plan_id, select_forbidden_jobs)
    active_jobs = load(dict_cursor, plan_id, select_active_jobs)
    areas = load(dict_cursor, plan_id, select_areas)
    dict_cursor.execute(select_score, {"planId": plan_id})
    scores = transform_score(dict_cursor.fetchall())

    model = LpProblem(name="Plan", sense=LpMinimize)
    model_variables = pd.DataFrame(columns=workers.keys())

    score = []

    counter = 0
    area_drivers = dict.fromkeys(areas.keys(), [])

    for job in jobs:
        job_vars = {}
        strongman = []
        driver = []
        for worker in workers:
            if is_viable(workers[worker], job_properties[job], forbidden_jobs, attempt):
                add_variable(counter,
                             driver,
                             first_round,
                             job_properties[job],
                             job_vars,
                             strongman,
                             worker,
                             workers,
                             area_drivers,
                             score, scores)
                counter += 1

        df_new_row = pd.DataFrame([pd.Series(job_vars, name=job)], columns=model_variables.columns)
        model_variables = pd.concat([model_variables, df_new_row])
        max_workers = job_properties[job]["maxWorkers"]
        min_workers = job_properties[job]["minWorkers"]

        model += (lpSum(job_vars.values()) <= max_workers)
        if first_round:
            model += (lpSum(strongman) >= job_properties[job]["strongWorkers"])
            if attempt < 1:
                model += (lpSum(driver) >= job_properties[job]["neededCars"])
        else:
            model += (lpSum(job_vars.values()) >= min_workers)
    for worker in workers:
        model += (lpSum(model_variables[worker].tolist()) <= 1)
        model += (lpSum(model_variables[worker].tolist()) >= 1)

    if attempt < 2:
        for forbid in forbids:
            friend = forbids[forbid]["forbid"]
            if friend not in workers.keys() or forbid not in workers.keys():
                continue
            for job in jobs:
                model = restrict_pair(forbid, friend, job, model, model_variables)
    if attempt > 0:
        for area in areas:
            model += (lpSum(area_drivers[area]) >= areas[area]["requiredDrivers"])

    model += lpSum(score)

    status = model.solve()
    if status == -1:
        if attempt >= 2:
            print("fail")  # ToDo - send message: check if valid - enough drivers, strongmen, workers
            return
        else:
            generate_plan(test_plan_id, test_connection, first_round, attempt + 1)
            return

    res_dict = {}
    model_variables.apply(lambda v: what_workers(v, res_dict), axis=1)

    save_to_db(res_dict, active_jobs, primitive_cursor)
    connection.commit()


def load(dict_cursor, plan_id, query):
    dict_cursor.execute(query, {"planId": plan_id})
    active_jobs = dictionarify(dict_cursor.fetchall())
    return active_jobs


def restrict_pair(forbid, friend, job, model, model_variables):
    if model_variables.at[job, forbid] is not None and model_variables.at[job, friend] is not None:
        model += (model_variables.at[job, forbid] + model_variables.at[job, friend]) <= 1
    return model


def add_variable(counter, driver, first_round, job, job_vars, strongman, worker, workers, area_driver, score, scores):
    name = "x" + str(counter)
    x = LpVariable(name, lowBound=0, upBound=1, cat='Binary')
    job_vars[worker] = x
    if (job["id"], worker) in scores.keys():
        score.append(scores[(job["id"], worker)] * x)
    if first_round:
        if workers[worker]["isStrong"]:
            strongman.append(x)
        if workers[worker]["isDriver"] and job["requiresCar"]:
            driver.append(workers[worker]["seats"] * x)
            area_driver[job["areaId"]].append(workers[worker]["seats"] * x)


def generate_rides(received_plan_id, connection):
    dict_cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    primitive_cursor = connection.cursor()
    psycopg2.extras.register_uuid()

    jobs = load(dict_cursor, received_plan_id, select_drive_jobs)
    for job in jobs:
        drivers = load(dict_cursor, job, select_driver)
        people = list(load(dict_cursor, job, select_people).keys()) + list(drivers.keys())
        people_pointer = 0
        for driver in drivers:
            if len(people) == 0:
                break
            people.remove(driver)
            ride = uuid.uuid4()
            dict_cursor.execute(insert_ride, {"uuid": ride, "driver": driver, "car": drivers[driver]["carId"], "job": job})
            connection.commit()
            seats = drivers[driver]["seats"]
            dict_cursor.execute(insert_rider, {"ride": ride, "worker": driver})
            seats -= 1
            while seats > 0 and people_pointer < len(people):
                dict_cursor.execute(insert_rider, {"ride": ride, "worker": people[people_pointer]})
                people_pointer += 1
                seats -= 1

    # find_people without ride people for area
    # find empty rides - id = area, ride, seats ORDER by seats

    # for people without ride
    # find best empty ride in the same area
    # add to ride(ride, worker)


def generate_plan_from_message(received_plan_id):
    connection = psycopg2.connect("postgresql://username:password@localhost:5432/summerjob",
                                  options="-c search_path=public")
    generate_rides(received_plan_id, connection)

    # generate_plan(received_plan_id, connection)
    # generate_plan(received_plan_id, connection, False)
    # generate_rides(received_plan_id, connection)