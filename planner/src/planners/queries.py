select_workers = """SELECT DISTINCT "workerId" as "id",
            "isStrong", 
            "allergies", 
            "Car".id IS NOT NULL as "isDriver", 
            day = any("adorationDays") as "isAdoring",
             "Car".seats as "seats"
    FROM "Plan" P JOIN "WorkerAvailability" WA on P."summerJobEventId" = WA."eventId" JOIN "Worker" W on WA."workerId" = W.id LEFT JOIN "Car" on W.id = "Car"."ownerId"
    WHERE day = any("workDays") AND "workerId" NOT IN (SELECT AJTW."B" as Id
    FROM "ActiveJob" JOIN "_ActiveJobToWorker" AJTW on "ActiveJob".id = AJTW."A"
    WHERE "ActiveJob"."planId" = %(planId)s) AND P.id = %(planId)s"""

select_strong_workers = select_workers + """AND ("Car".id IS NOT NULL OR "isStrong")"""

select_jobs = """SELECT "proposedJobId" FROM "ActiveJob" WHERE "planId" = %(planId)s """

select_job_details = """WITH CW AS (SELECT "proposedJobId", count(AJTW."B") as currentWorkers
    FROM "ActiveJob" LEFT JOIN "_ActiveJobToWorker" AJTW on "ActiveJob".id = AJTW."A"
    WHERE "ActiveJob"."planId" = %(planId)s
    GROUP BY "proposedJobId"),
    CWS AS (SELECT "proposedJobId", count(S."B") as currentStrongWorkers
        FROM "ActiveJob" AJ LEFT JOIN (SELECT * FROM "_ActiveJobToWorker" AJTW  WHERE "B" IN (SELECT "id" FROM "Worker" WHERE "isStrong")) S
            ON S."A"=AJ."id"
        WHERE AJ."planId" = %(planId)s
        GROUP BY "proposedJobId")
SELECT PJ.id,
       "maxWorkers" - cw.currentWorkers as "maxWorkers",
       "minWorkers" - cw.currentWorkers as "minWorkers",
       CASE WHEN "strongWorkers" - currentStrongWorkers < 0 THEN 0 ELSE "strongWorkers" - currentStrongWorkers END as "strongWorkers",
       "jobType",
       "allergens",
       "requiresCar",
       "supportsAdoration",
       "areaId",
       (("maxWorkers" - "minWorkers")/2 - 1) as "neededCars"

    FROM "ProposedJob" PJ LEFT JOIN CW ON CW."proposedJobId" = PJ.id JOIN "Area" A ON PJ."areaId" = A.id LEFT JOIN CWS ON CWS."proposedJobId" = PJ.id
    WHERE PJ.id in (SELECT "proposedJobId" FROM "ActiveJob" WHERE "planId" = %(planId)s)"""

select_areas = """SELECT DISTINCT "areaId" as id, (sum("minWorkers") + sum("maxWorkers"))/2 as "requiredDrivers" FROM "ActiveJob" JOIN "ProposedJob" PJ on PJ.id = "ActiveJob"."proposedJobId"
                         WHERE "areaId" IN (SELECT id FROM "Area" WHERE "requiresCar") AND "planId" = %(planId)s
                         GROUP BY "areaId";"""

select_active_jobs = """SELECT "proposedJobId" as id, "id" as "activeJobId"  FROM "ActiveJob" WHERE "planId" = %(planId)s"""

insert_plan = """INSERT INTO "_ActiveJobToWorker" ("A", "B") VALUES (%(job)s, %(worker)s)"""

select_forbids = """WITH forbid as (SELECT id, forbid FROM (SELECT  S."B" as id, F."B" as forbid, count(*) as count FROM "_ActiveJobToWorker" F JOIN "_ActiveJobToWorker" S ON F."A" = S."A"
                                        GROUP BY S."B", F."B")  forbid
                WHERE count >= (SELECT count(DISTINCT "planId")/2+1
                                FROM "ActiveJob" JOIN "Plan" ON "planId" = "Plan".id
                                WHERE day < (SELECT day FROM "Plan" WHERE "Plan".id = %(planId)s)))
SELECT id, forbid
 FROM forbid
   WHERE id > forbid"""

select_forbidden_jobs = """SELECT forbid.id, array_agg(AJ."proposedJobId") FROM (SELECT  S."B" as id, F."B" as forbid, count(*) as count FROM "_ActiveJobToWorker" F JOIN "_ActiveJobToWorker" S ON F."A" = S."A"
                                        GROUP BY S."B", F."B")  forbid JOIN "_ActiveJobToWorker" ON forbid = "_ActiveJobToWorker"."B" JOIN "ActiveJob" AJ on AJ.id = "_ActiveJobToWorker"."A"
                WHERE count >= (SELECT count(DISTINCT "planId")/2+1
                                FROM "ActiveJob" JOIN "Plan" ON "planId" = "Plan".id
                                WHERE day < (SELECT day FROM "Plan" WHERE "Plan".id = %(planId)s))
GROUP BY forbid.id;"""

select_score = """WITH stats as
    (SELECT AJ."B" as worker, "jobType", count(*) as score
     FROM "_ActiveJobToWorker" AJ JOIN "ActiveJob" A on A.id = AJ."A" JOIN "ProposedJob" PJ on PJ.id = A."proposedJobId" JOIN "Plan" ON "planId" = "Plan".id
                                WHERE day < (SELECT day FROM "Plan" WHERE "Plan".id = %(planId)s)
     GROUP BY  AJ."B", "jobType")
SELECT worker, PJ.id as job, score FROM stats JOIN "ProposedJob" PJ ON stats."jobType" = PJ."jobType"; """

select_drive_jobs = """
WITH seats as (SELECT AJ.id, sum("seats") as seats
    FROM "ActiveJob" AJ JOIN "_ActiveJobToWorker" AJTW on AJ.id = AJTW."A" JOIN "Worker" W on W.id = AJTW."B" JOIN "Car" C on W.id = C."ownerId"
    WHERE "planId" =  %(planId)s
    GROUP BY AJ.id),
    people as (SELECT AJ.id, count(W.id) as need
    FROM "ActiveJob" AJ JOIN "_ActiveJobToWorker" AJTW on AJ.id = AJTW."A" JOIN "Worker" W on W.id = AJTW."B"
    WHERE "planId" =  %(planId)s
    GROUP BY AJ.id)
SELECT seats.id,seats >= need as ok
FROM seats JOIN people ON people.id = seats.id JOIN "ActiveJob" AJ ON AJ.id = seats.id JOIN "ProposedJob" PJ on PJ.id = AJ."proposedJobId"
    WHERE "areaId" IN (SELECT id FROM "Area" WHERE "requiresCar") ORDER BY  ok desc;
"""

select_driver = """SELECT W.id as id, C.id as "carId", "seats"
    FROM "ActiveJob" AJ JOIN "_ActiveJobToWorker" AJTW on AJ.id = AJTW."A" JOIN "Worker" W on W.id = AJTW."B" JOIN "Car" C on W.id = C."ownerId"
    WHERE AJ."id" = %(planId)s 
    """

select_people = """SELECT "B" as id FROM "_ActiveJobToWorker" AJTW WHERE "A" = %(planId)s AND AJTW."B" not in (SELECT "ownerId" FROM "Car") """

insert_ride = """INSERT INTO "Ride" ("id", "driverId", "carId", "jobId") VALUES (%(uuid)s, %(driver)s, %(car)s, %(job)s)"""

insert_rider = """INSERT INTO "_RideToWorker" ("A", "B") VALUES (%(ride)s, %(worker)s)"""