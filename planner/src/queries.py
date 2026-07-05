from __future__ import annotations

from sqlalchemy import text

_SELECT_WORKERS = """
SELECT DISTINCT "workerId" as "id",
    "isStrong",
    (
        SELECT array_agg(WA.name)
        FROM "_WorkAllergyToWorker" WAW
        JOIN "WorkAllergy" WA ON WAW."A" = WA.id
        WHERE WAW."B" = W.id
    ) as "workAllergies",
    "Car".id IS NOT NULL as "isDriver",
    EXISTS(
        SELECT 1 FROM "_SlotWorkers" SW
        JOIN "AdorationSlot" AS_slot ON SW."A" = AS_slot.id
        WHERE SW."B" = W.id
        AND AS_slot."eventId" = P."summerJobEventId"
        AND DATE(AS_slot."dateStart") = P.day
        AND EXTRACT(HOUR FROM AS_slot."dateStart") >= 9
        AND EXTRACT(HOUR FROM AS_slot."dateStart") < 17
    ) as "isAdoring",
     "Car".seats as "seats"
FROM "Plan" P
JOIN "WorkerAvailability" WA on P."summerJobEventId" = WA."eventId"
JOIN "Worker" W on WA."workerId" = W.id
LEFT JOIN "Car" on W.id = "Car"."ownerId" AND "Car"."forEventId" = P."summerJobEventId"
WHERE day = any("workDays")
AND "workerId" NOT IN (
    SELECT AJTW."B" as Id
    FROM "ActiveJob" JOIN "_ActiveJobToWorker" AJTW on "ActiveJob".id = AJTW."A"
    WHERE "ActiveJob"."planId" = :planId
)
AND P.id = :planId
"""

select_workers = text(_SELECT_WORKERS)
select_strong_workers = text(_SELECT_WORKERS + """ AND ("Car".id IS NOT NULL OR "isStrong")""")

select_jobs = text("""
SELECT "proposedJobId" FROM "ActiveJob" WHERE "planId" = :planId
""")

select_job_details = text("""
WITH CW AS (
    SELECT "proposedJobId", count(AJTW."B") as currentWorkers
    FROM "ActiveJob" LEFT JOIN "_ActiveJobToWorker" AJTW on "ActiveJob".id = AJTW."A"
    WHERE "ActiveJob"."planId" = :planId
    GROUP BY "proposedJobId"
),
CWS AS (
    SELECT "proposedJobId", count(S."B") as currentStrongWorkers
    FROM "ActiveJob" AJ
    LEFT JOIN (
        SELECT * FROM "_ActiveJobToWorker" AJTW
        WHERE "B" IN (SELECT "id" FROM "Worker" WHERE "isStrong")
    ) S ON S."A" = AJ."id"
    WHERE AJ."planId" = :planId
    GROUP BY "proposedJobId"
)
SELECT PJ.id,
    "maxWorkers" - cw.currentWorkers as "maxWorkers",
    "minWorkers" - cw.currentWorkers as "minWorkers",
    CASE WHEN "strongWorkers" - currentStrongWorkers < 0 THEN 0 ELSE "strongWorkers" - currentStrongWorkers END as "strongWorkers",
     "jobTypeId",
    (
        SELECT array_agg(WA.name)
        FROM "_ProposedJobToWorkAllergy" PJWA
        JOIN "WorkAllergy" WA ON PJWA."B" = WA.id
        WHERE PJWA."A" = PJ.id
    ) as "allergens",
    "requiresCar",
    "supportsAdoration",
    "areaId",
    (("maxWorkers" - "minWorkers")/2 - 1) as "neededCars"
FROM "ProposedJob" PJ
LEFT JOIN CW ON CW."proposedJobId" = PJ.id
JOIN "Area" A ON PJ."areaId" = A.id
LEFT JOIN CWS ON CWS."proposedJobId" = PJ.id
WHERE PJ.id in (SELECT "proposedJobId" FROM "ActiveJob" WHERE "planId" = :planId)
""")

select_areas = text("""
SELECT DISTINCT "areaId" as id,
    (sum("minWorkers") + sum("maxWorkers"))/2 as "requiredDrivers"
FROM "ActiveJob"
JOIN "ProposedJob" PJ on PJ.id = "ActiveJob"."proposedJobId"
WHERE "areaId" IN (SELECT id FROM "Area" WHERE "requiresCar")
AND "planId" = :planId
GROUP BY "areaId"
""")

select_active_jobs = text("""
SELECT "proposedJobId" as id, "id" as "activeJobId"
FROM "ActiveJob" WHERE "planId" = :planId
""")

insert_plan = text("""
INSERT INTO "_ActiveJobToWorker" ("A", "B") VALUES (:job, :worker)
""")

select_forbids = text("""
WITH forbid AS (
    SELECT id, forbid FROM (
        SELECT S."B" as id, F."B" as forbid, count(*) as count
        FROM "_ActiveJobToWorker" F
        JOIN "_ActiveJobToWorker" S ON F."A" = S."A"
        GROUP BY S."B", F."B"
    ) forbid
    WHERE count >= (
        SELECT count(DISTINCT "planId")/2+1
        FROM "ActiveJob" JOIN "Plan" ON "planId" = "Plan".id
        WHERE day < (SELECT day FROM "Plan" WHERE "Plan".id = :planId)
    )
)
SELECT id, forbid
FROM forbid
WHERE id > forbid
""")

select_forbidden_jobs = text("""
SELECT forbid.id, array_agg(AJ."proposedJobId")
FROM (
    SELECT S."B" as id, F."B" as forbid, count(*) as count
    FROM "_ActiveJobToWorker" F
    JOIN "_ActiveJobToWorker" S ON F."A" = S."A"
    GROUP BY S."B", F."B"
) forbid
JOIN "_ActiveJobToWorker" ON forbid = "_ActiveJobToWorker"."B"
JOIN "ActiveJob" AJ on AJ.id = "_ActiveJobToWorker"."A"
WHERE count >= (
    SELECT count(DISTINCT "planId")/2+1
    FROM "ActiveJob" JOIN "Plan" ON "planId" = "Plan".id
    WHERE day < (SELECT day FROM "Plan" WHERE "Plan".id = :planId)
)
GROUP BY forbid.id
""")

select_score = text("""
WITH stats AS (
    SELECT AJ."B" as worker, PJ."jobTypeId" as job_type_id, count(*) as score
    FROM "_ActiveJobToWorker" AJ
    JOIN "ActiveJob" A on A.id = AJ."A"
    JOIN "ProposedJob" PJ on PJ.id = A."proposedJobId"
    JOIN "Plan" ON "planId" = "Plan".id
    WHERE day < (SELECT day FROM "Plan" WHERE "Plan".id = :planId)
    GROUP BY AJ."B", PJ."jobTypeId"
)
SELECT worker, PJ.id as job, score
FROM stats
JOIN "ProposedJob" PJ ON stats.job_type_id = PJ."jobTypeId"
""")

select_cooccurrence = text("""
SELECT S."B" as worker_a, F."B" as worker_b, count(*) as count
FROM "_ActiveJobToWorker" S
JOIN "_ActiveJobToWorker" F ON S."A" = F."A" AND S."B" < F."B"
JOIN "ActiveJob" AJ ON AJ.id = S."A"
JOIN "Plan" P ON P.id = AJ."planId"
WHERE P.day < (
    SELECT day FROM "Plan" WHERE "Plan".id = :planId
)
AND P."summerJobEventId" = (
    SELECT "summerJobEventId" FROM "Plan" WHERE "Plan".id = :planId
)
GROUP BY S."B", F."B"
""")

select_drive_jobs = text("""
WITH seats AS (
    SELECT AJ.id, sum("seats") as seats
    FROM "ActiveJob" AJ
    JOIN "_ActiveJobToWorker" AJTW on AJ.id = AJTW."A"
    JOIN "Worker" W on W.id = AJTW."B"
    JOIN "Car" C on W.id = C."ownerId"
    JOIN "Plan" P on AJ."planId" = P.id
    WHERE "planId" = :planId AND C."forEventId" = P."summerJobEventId"
    GROUP BY AJ.id
),
people AS (
    SELECT AJ.id, count(W.id) as need
    FROM "ActiveJob" AJ
    JOIN "_ActiveJobToWorker" AJTW on AJ.id = AJTW."A"
    JOIN "Worker" W on W.id = AJTW."B"
    WHERE "planId" = :planId
    GROUP BY AJ.id
)
SELECT seats.id, seats >= need as ok
FROM seats
JOIN people ON people.id = seats.id
JOIN "ActiveJob" AJ ON AJ.id = seats.id
JOIN "ProposedJob" PJ on PJ.id = AJ."proposedJobId"
WHERE "areaId" IN (SELECT id FROM "Area" WHERE "requiresCar")
ORDER BY ok desc
""")

select_driver = text("""
SELECT W.id as id, C.id as "carId", "seats"
FROM "ActiveJob" AJ
JOIN "_ActiveJobToWorker" AJTW on AJ.id = AJTW."A"
JOIN "Worker" W on W.id = AJTW."B"
JOIN "Car" C on W.id = C."ownerId"
JOIN "Plan" P on AJ."planId" = P.id
WHERE AJ."id" = :planId AND C."forEventId" = P."summerJobEventId"
""")

select_people = text("""
SELECT "B" as id
FROM "_ActiveJobToWorker" AJTW
JOIN "ActiveJob" AJ on AJTW."A" = AJ.id
JOIN "Plan" P on AJ."planId" = P.id
WHERE AJTW."A" = :planId
AND AJTW."B" not in (
    SELECT "ownerId" FROM "Car" WHERE "forEventId" = P."summerJobEventId"
)
""")

insert_ride = text("""
INSERT INTO "Ride" ("id", "driverId", "carId", "jobId") VALUES (:uuid, :driver, :car, :job)
""")

insert_rider = text("""
INSERT INTO "_RideToWorker" ("A", "B") VALUES (:ride, :worker)
""")
