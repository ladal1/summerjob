import os
import psycopg2
import psycopg2.extras
from pulp import LpMinimize, LpProblem, lpSum, LpVariable
import pandas as pd
import uuid
from dotenv import load_dotenv

from src.queries import (
    insert_plan, select_jobs, select_job_details, select_strong_workers, select_workers,
    select_forbids, select_forbidden_jobs, select_active_jobs, select_areas, select_score,
    select_drive_jobs, select_driver, select_people, insert_ride, insert_rider
)

# Load variables from .env
load_dotenv()
POSTGRES_USER = os.getenv("POSTGRES_USER")
POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD")
POSTGRES_DB = os.getenv("POSTGRES_DB")
DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@localhost:5432/{POSTGRES_DB}"


def dictionarify(query_results):
    return {row["id"]: {**row} for row in query_results}


def transform_score(query_results):
    return {(row["job"], row["worker"]): row["score"] for row in query_results}


def is_viable(worker, job, forbidden, attempt):
    # Handle worker allergies - ensure we have a proper list/array
    worker_allergies = worker["workAllergies"] or []
    if isinstance(worker_allergies, str):
        # If it's a string like "DUST" or "{DUST,MITES}", parse it
        if worker_allergies.startswith('{') and worker_allergies.endswith('}'):
            # Handle PostgreSQL array format like "{DUST,MITES}"
            worker_allergies = worker_allergies[1:-1].split(',') if len(worker_allergies) > 2 else []
        else:
            # Handle single allergy as string
            worker_allergies = [worker_allergies] if worker_allergies else []
    
    # Handle job allergens - ensure we have a proper list/array  
    job_allergens = job["allergens"] or []
    if isinstance(job_allergens, str):
        # If it's a string like "{}" or "{DUST,MITES}", parse it
        if job_allergens.startswith('{') and job_allergens.endswith('}'):
            # Handle PostgreSQL array format like "{DUST,MITES}"
            job_allergens = job_allergens[1:-1].split(',') if len(job_allergens) > 2 else []
        else:
            # Handle single allergen as string
            job_allergens = [job_allergens] if job_allergens else []
    
    # Check if worker's allergies conflict with job allergens
    allergies_ok = set(worker_allergies).isdisjoint(set(job_allergens))
    
    # Check adoration requirements
    adoration_ok = (worker["isAdoring"] and job["supportsAdoration"]) or not worker["isAdoring"]
    
    # Check if job is forbidden for this worker (unless it's a retry attempt)
    forbidden_ok = job["id"] not in forbidden or attempt > 1
    
    return allergies_ok and adoration_ok and forbidden_ok


def what_workers(row, plan):
    workers = [index for index, value in row.items() if hasattr(value, 'varValue') and value.varValue > 0]
    plan[row.name] = workers


def save_to_db(res_dict, active_jobs, cursor):
    for index, value in res_dict.items():
        for val in value:
            cursor.execute(insert_plan, {"job": active_jobs[index]["activeJobId"], "worker": val})


def generate_plan(plan_id, connection, first_round=True, attempt=0):
    dict_cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    primitive_cursor = connection.cursor()

    primitive_cursor.execute(select_jobs, {"planId": plan_id})
    jobs = [x[0] for x in primitive_cursor.fetchall()]

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
    area_drivers = {area: [] for area in areas}

    for job in jobs:
        job_vars, strongman, driver = {}, [], []
        for worker in workers:
            if is_viable(workers[worker], job_properties[job], forbidden_jobs, attempt):
                add_variable(counter, driver, first_round, job_properties[job], job_vars,
                             strongman, worker, workers, area_drivers, score, scores)
                counter += 1

        df_new_row = pd.DataFrame([pd.Series(job_vars, name=job)], columns=model_variables.columns)
        model_variables = pd.concat([model_variables, df_new_row])

        max_workers = job_properties[job]["maxWorkers"]
        min_workers = job_properties[job]["minWorkers"]

        model += lpSum(job_vars.values()) <= max_workers
        if first_round:
            model += lpSum(strongman) >= job_properties[job]["strongWorkers"]
            if attempt < 1:
                model += lpSum(driver) >= job_properties[job]["neededCars"]
        else:
            model += lpSum(job_vars.values()) >= min_workers

    for worker in workers:
        model += lpSum(model_variables[worker].dropna().tolist()) == 1

    if attempt < 2:
        for forbid in forbids:
            friend = forbids[forbid]["forbid"]
            if friend in workers and forbid in workers:
                for job in jobs:
                    model = restrict_pair(forbid, friend, job, model, model_variables)

    if attempt > 0:
        for area in areas:
            model += lpSum(area_drivers[area]) >= areas[area]["requiredDrivers"]

    model += lpSum(score)

    # Debug information before solving
    print(f"=== DEBUG INFO - Attempt {attempt}, First Round: {first_round} ===")
    print(f"Total workers: {len(workers)}")
    print(f"Total jobs: {len(jobs)}")
    print(f"Strong workers: {sum(1 for w in workers.values() if w['isStrong'])}")
    print(f"Drivers: {sum(1 for w in workers.values() if w['isDriver'])}")
    
    # Check job requirements
    total_min_workers = sum(job_properties[job]["minWorkers"] for job in jobs)
    total_max_workers = sum(job_properties[job]["maxWorkers"] for job in jobs)
    total_strong_needed = sum(job_properties[job]["strongWorkers"] for job in jobs) if first_round else 0
    total_cars_needed = sum(job_properties[job]["neededCars"] for job in jobs) if first_round and attempt < 1 else 0
    
    print(f"Total minimum workers needed: {total_min_workers}")
    print(f"Total maximum workers available: {total_max_workers}")
    if first_round:
        print(f"Total strong workers needed: {total_strong_needed}")
        if attempt < 1:
            print(f"Total cars needed: {total_cars_needed}")
    
    # Check viability constraints with detailed breakdown
    viable_assignments = 0
    jobs_with_zero_viable = []
    for job in jobs:
        viable_for_job = 0
        allergy_blocked = 0
        adoration_blocked = 0
        forbidden_blocked = 0
        
        for worker in workers:
            worker_data = workers[worker]
            job_data = job_properties[job]
            
            # Check each constraint individually
            worker_allergies = worker_data["workAllergies"] or []
            if isinstance(worker_allergies, str):
                if worker_allergies.startswith('{') and worker_allergies.endswith('}'):
                    worker_allergies = worker_allergies[1:-1].split(',') if len(worker_allergies) > 2 else []
                else:
                    worker_allergies = [worker_allergies] if worker_allergies else []
            
            job_allergens = job_data["allergens"] or []
            if isinstance(job_allergens, str):
                if job_allergens.startswith('{') and job_allergens.endswith('}'):
                    job_allergens = job_allergens[1:-1].split(',') if len(job_allergens) > 2 else []
                else:
                    job_allergens = [job_allergens] if job_allergens else []
            
            allergies_ok = set(worker_allergies).isdisjoint(set(job_allergens))
            adoration_ok = (worker_data["isAdoring"] and job_data["supportsAdoration"]) or not worker_data["isAdoring"]
            forbidden_ok = job_data["id"] not in forbidden_jobs or attempt > 1
            
            if not allergies_ok:
                allergy_blocked += 1
            elif not adoration_ok:
                adoration_blocked += 1
            elif not forbidden_ok:
                forbidden_blocked += 1
            else:
                viable_for_job += 1
                viable_assignments += 1
        
        print(f"Job {job}: {viable_for_job} viable workers (needs {job_properties[job]['minWorkers']}-{job_properties[job]['maxWorkers']})")
        
        if viable_for_job == 0:
            jobs_with_zero_viable.append(job)
            print(f"  ❌ BLOCKED: {allergy_blocked} by allergies, {adoration_blocked} by adoration, {forbidden_blocked} by forbidden")
            print(f"  Job allergens: {job_data.get('allergens', [])}")
            print(f"  Job supports adoration: {job_data.get('supportsAdoration', False)}")
            print(f"  Job forbidden: {job_data['id'] in forbidden_jobs}")
        elif viable_for_job < job_properties[job]['minWorkers']:
            print(f"  ⚠️  INSUFFICIENT: needs {job_properties[job]['minWorkers']} but only {viable_for_job} viable")
    
    if jobs_with_zero_viable:
        print(f"\n🚨 CRITICAL: {len(jobs_with_zero_viable)} jobs have ZERO viable workers!")
        print(f"Zero-viable jobs: {jobs_with_zero_viable[:3]}{'...' if len(jobs_with_zero_viable) > 3 else ''}")
    
    print(f"Total viable worker-job assignments: {viable_assignments}")
    print(f"Total forbidden pairs constraints: {len(forbids)}")
    print(f"Total forbidden jobs for workers: {len(forbidden_jobs)}")
    
    # Sample worker allergies and adoration status
    workers_with_allergies = sum(1 for w in workers.values() if w.get("workAllergies") and len(w["workAllergies"]) > 0)
    adoring_workers = sum(1 for w in workers.values() if w.get("isAdoring", False))
    print(f"Workers with allergies: {workers_with_allergies}")
    print(f"Adoring workers: {adoring_workers}")
    
    # Sample job characteristics for zero-viable jobs
    if len(jobs_with_zero_viable) > 0:
        print(f"\nAnalyzing first zero-viable job: {jobs_with_zero_viable[0]}")
        sample_job = job_properties[jobs_with_zero_viable[0]]
        print(f"  Allergens: {sample_job.get('allergens', [])}")
        print(f"  Supports adoration: {sample_job.get('supportsAdoration', False)}")
        print(f"  In forbidden list: {sample_job['id'] in forbidden_jobs}")
        
        # Test allergy logic with a sample worker
        sample_worker_id = list(workers.keys())[0]
        sample_worker = workers[sample_worker_id]
        print(f"\nTesting allergy logic with worker {sample_worker_id}:")
        
        # Parse worker allergies properly
        raw_worker_allergies = sample_worker.get('workAllergies', [])
        worker_allergies = raw_worker_allergies or []
        if isinstance(worker_allergies, str):
            if worker_allergies.startswith('{') and worker_allergies.endswith('}'):
                worker_allergies = worker_allergies[1:-1].split(',') if len(worker_allergies) > 2 else []
            else:
                worker_allergies = [worker_allergies] if worker_allergies else []
        
        # Parse job allergens properly  
        raw_job_allergens = sample_job.get('allergens', [])
        job_allergens = raw_job_allergens or []
        if isinstance(job_allergens, str):
            if job_allergens.startswith('{') and job_allergens.endswith('}'):
                job_allergens = job_allergens[1:-1].split(',') if len(job_allergens) > 2 else []
            else:
                job_allergens = [job_allergens] if job_allergens else []
        
        print(f"  Worker allergies (raw): {raw_worker_allergies}")
        print(f"  Worker allergies (parsed): {worker_allergies}")
        print(f"  Job allergens (raw): {raw_job_allergens}")
        print(f"  Job allergens (parsed): {job_allergens}")
        
        worker_allergy_set = set(worker_allergies)
        job_allergen_set = set(job_allergens)
        is_disjoint = worker_allergy_set.isdisjoint(job_allergen_set)
        print(f"  Worker allergy set: {worker_allergy_set}")
        print(f"  Job allergen set: {job_allergen_set}")
        print(f"  Are disjoint (no conflict): {is_disjoint}")
        print(f"  Intersection (conflicts): {worker_allergy_set.intersection(job_allergen_set)}")
        
        # Test with multiple workers to see the pattern
        print("\nTesting allergy logic with first 3 workers on this job:")
        for i, worker_id in enumerate(list(workers.keys())[:3]):
            worker = workers[worker_id]
            worker_allergies = set(worker["workAllergies"] or [])
            job_allergens = set(sample_job["allergens"] or [])
            is_disjoint = worker_allergies.isdisjoint(job_allergens)
            print(f"  Worker {i+1}: allergies={worker_allergies}, disjoint={is_disjoint}")
    
    if attempt > 0:
        print("Area driver requirements:")
        for area in areas:
            print(f"  Area {area}: needs {areas[area]['requiredDrivers']} drivers")

    status = model.solve()
    if status == -1:
        print(f"SOLVER FAILED - Status: {status}")
        print("Possible causes:")
        print("1. Not enough workers for job minimum requirements")
        print("2. Insufficient strong workers or drivers")
        print("3. Too many forbidden combinations")
        print("4. Conflicting area driver requirements")
        print("5. Allergy conflicts eliminating too many assignments")
        if attempt >= 2:
            print("Maximum retry attempts reached - giving up")
            return
        else:
            print(f"Retrying with attempt {attempt + 1}...")
            generate_plan(plan_id, connection, first_round, attempt + 1)
            return
    else:
        print(f"SOLVER SUCCESS - Status: {status}")
        print("="*50)

    res_dict = {}
    model_variables.apply(lambda v: what_workers(v, res_dict), axis=1)

    save_to_db(res_dict, active_jobs, primitive_cursor)
    connection.commit()


def load(dict_cursor, plan_id, query):
    dict_cursor.execute(query, {"planId": plan_id})
    return dictionarify(dict_cursor.fetchall())


def restrict_pair(forbid, friend, job, model, model_variables):
    forbid_var = model_variables.at[job, forbid] if not pd.isna(model_variables.at[job, forbid]) else None
    friend_var = model_variables.at[job, friend] if not pd.isna(model_variables.at[job, friend]) else None
    
    if forbid_var is not None and friend_var is not None:
        model += forbid_var + friend_var <= 1
    return model


def add_variable(counter, driver, first_round, job, job_vars, strongman, worker, workers, area_driver, score, scores):
    name = f"x{counter}"
    x = LpVariable(name, lowBound=0, upBound=1, cat='Binary')
    job_vars[worker] = x
    if (job["id"], worker) in scores:
        score.append(scores[(job["id"], worker)] * x)
    if first_round:
        if workers[worker]["isStrong"]:
            strongman.append(x)
        if workers[worker]["isDriver"] and job["requiresCar"]:
            driver.append(workers[worker]["seats"] * x)
            area_driver[job["areaId"]].append(workers[worker]["seats"] * x)


def generate_rides(received_plan_id, connection):
    dict_cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    psycopg2.extras.register_uuid()

    jobs = load(dict_cursor, received_plan_id, select_drive_jobs)
    for job in jobs:
        drivers = load(dict_cursor, job, select_driver)
        people = list(load(dict_cursor, job, select_people).keys())
        
        # Remove drivers from people list to avoid double counting
        for driver_id in drivers.keys():
            if driver_id in people:
                people.remove(driver_id)
        
        people_pointer = 0
        for driver in drivers:
            ride = uuid.uuid4()
            dict_cursor.execute(insert_ride, {"uuid": ride, "driver": driver, "car": drivers[driver]["carId"], "job": job})
            connection.commit()
            seats = drivers[driver]["seats"]
            # Don't add the driver as a rider - they're already the driver
            # dict_cursor.execute(insert_rider, {"ride": ride, "worker": driver})
            seats -= 1  # Driver
            while seats > 0 and people_pointer < len(people):
                dict_cursor.execute(insert_rider, {"ride": ride, "worker": people[people_pointer]})
                people_pointer += 1
                seats -= 1


def generate_plan_from_message(received_plan_id):
    connection = psycopg2.connect(DATABASE_URL, options="-c search_path=public")
    generate_plan(received_plan_id, connection)
    generate_plan(received_plan_id, connection, False)
    generate_rides(received_plan_id, connection)
    print("Plan generation completed. Listening for the next messages...")