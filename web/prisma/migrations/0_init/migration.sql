-- CreateEnum
CREATE TYPE "Allergy" AS ENUM ('DUST', 'ANIMALS', 'HAY', 'POLLEN', 'MITES');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('WOOD', 'PAINTING', 'HOUSEWORK', 'GARDEN', 'OTHER');

-- CreateEnum
CREATE TYPE "ToolName" AS ENUM ('AXE', 'BOW_SAW', 'LADDER', 'PAINT', 'PAINT_ROLLER', 'COVER_SHEET', 'MASKING_TAPE', 'PAINT_BRUSH', 'SCRAPER_GRID', 'PAINTER_SPATULA', 'JAPANESE_SPATULA', 'GYPSUM', 'BUCKET', 'RAG', 'BROOM', 'SAW', 'BRUSHCUTTER', 'GLOVES', 'RESPIRATOR', 'HEADPHONES', 'CHAINSAW', 'CIRCULAR_SAW', 'RAKE', 'PITCHFORK', 'SHOVEL');

-- CreateEnum
CREATE TYPE "Skill" AS ENUM ('LUMBERJACK', 'ARTIST', 'GARDENER', 'DANGER', 'ELECTRICIAN', 'HEIGHTS', 'MASON');

-- CreateEnum
CREATE TYPE "PostTag" AS ENUM ('EATING', 'SPORTS', 'CULTURAL', 'EDUCATIONAL', 'RELIGIOUS', 'INFORMATIVE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "tool" "ToolName" NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "proposedJobOnSiteId" TEXT,
    "proposedJobToTakeWithId" TEXT,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "workerId" TEXT NOT NULL,
    "postId" TEXT NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("workerId","postId")
);

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "madeIn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "availability" DATE[],
    "timeFrom" TEXT,
    "timeTo" TEXT,
    "address" TEXT,
    "coordinates" DOUBLE PRECISION[],
    "tags" "PostTag"[],
    "shortDescription" TEXT NOT NULL,
    "longDescription" TEXT NOT NULL,
    "photoPath" TEXT,
    "isOpenForParticipants" BOOLEAN NOT NULL DEFAULT false,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "forEventId" TEXT NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobPhoto" (
    "id" TEXT NOT NULL,
    "photoPath" TEXT NOT NULL,
    "proposedJobId" TEXT,

    CONSTRAINT "JobPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isStrong" BOOLEAN NOT NULL DEFAULT false,
    "isTeam" BOOLEAN NOT NULL DEFAULT false,
    "allergies" "Allergy"[],
    "skills" "Skill"[],
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "blocked" BOOLEAN NOT NULL DEFAULT false,
    "permissionsId" TEXT NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "photoPath" TEXT,
    "age" INTEGER,

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerPermissions" (
    "id" TEXT NOT NULL,
    "permissions" TEXT[],

    CONSTRAINT "WorkerPermissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerAvailability" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "workDays" DATE[],
    "adorationDays" DATE[],

    CONSTRAINT "WorkerAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Car" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "seats" INTEGER NOT NULL,
    "ownerId" TEXT NOT NULL,
    "odometerStart" INTEGER NOT NULL,
    "odometerEnd" INTEGER NOT NULL,
    "reimbursementAmount" INTEGER NOT NULL DEFAULT 0,
    "reimbursed" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "forEventId" TEXT NOT NULL,

    CONSTRAINT "Car_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProposedJob" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "publicDescription" TEXT NOT NULL DEFAULT '',
    "privateDescription" TEXT NOT NULL DEFAULT '',
    "requiredDays" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "minWorkers" INTEGER NOT NULL,
    "maxWorkers" INTEGER NOT NULL,
    "strongWorkers" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "coordinates" DOUBLE PRECISION[],
    "contact" TEXT NOT NULL,
    "hasFood" BOOLEAN NOT NULL DEFAULT false,
    "hasShower" BOOLEAN NOT NULL DEFAULT false,
    "areaId" TEXT,
    "allergens" "Allergy"[],
    "availability" DATE[],
    "jobType" "JobType" NOT NULL DEFAULT 'OTHER',
    "priority" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "ProposedJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinnedProposedJobByWorker" (
    "workerId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "PinnedProposedJobByWorker_pkey" PRIMARY KEY ("workerId","jobId")
);

-- CreateTable
CREATE TABLE "ActiveJob" (
    "id" TEXT NOT NULL,
    "proposedJobId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "responsibleWorkerId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ActiveJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ride" (
    "id" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "carId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "Ride_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "summerJobEventId" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Area" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "requiresCar" BOOLEAN NOT NULL,
    "supportsAdoration" BOOLEAN NOT NULL DEFAULT false,
    "summerJobEventId" TEXT NOT NULL,

    CONSTRAINT "Area_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SummerJobEvent" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SummerJobEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Logging" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "Logging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthDate" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pastParticipation" BOOLEAN NOT NULL,
    "arrivalDate" TIMESTAMP(3) NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "foodAllergies" TEXT,
    "workAllergies" TEXT,
    "toolsSkills" TEXT NOT NULL,
    "toolsBringing" TEXT NOT NULL,
    "heardAboutUs" TEXT,
    "playsInstrument" TEXT,
    "tShirtSize" TEXT,
    "additionalInfo" TEXT,
    "photo" TEXT NOT NULL,
    "accommodationPrice" TEXT NOT NULL,
    "ownsCar" BOOLEAN NOT NULL DEFAULT false,
    "canBeMedic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActiveJobToWorker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_RideToWorker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Worker_email_key" ON "Worker"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_permissionsId_key" ON "Worker"("permissionsId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerAvailability_workerId_eventId_key" ON "WorkerAvailability"("workerId", "eventId");

-- CreateIndex
CREATE UNIQUE INDEX "ActiveJob_proposedJobId_planId_key" ON "ActiveJob"("proposedJobId", "planId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_day_key" ON "Plan"("day");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Application_email_key" ON "Application"("email");

-- CreateIndex
CREATE UNIQUE INDEX "_ActiveJobToWorker_AB_unique" ON "_ActiveJobToWorker"("A", "B");

-- CreateIndex
CREATE INDEX "_ActiveJobToWorker_B_index" ON "_ActiveJobToWorker"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_RideToWorker_AB_unique" ON "_RideToWorker"("A", "B");

-- CreateIndex
CREATE INDEX "_RideToWorker_B_index" ON "_RideToWorker"("B");

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_proposedJobOnSiteId_fkey" FOREIGN KEY ("proposedJobOnSiteId") REFERENCES "ProposedJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_proposedJobToTakeWithId_fkey" FOREIGN KEY ("proposedJobToTakeWithId") REFERENCES "ProposedJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_forEventId_fkey" FOREIGN KEY ("forEventId") REFERENCES "SummerJobEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPhoto" ADD CONSTRAINT "JobPhoto_proposedJobId_fkey" FOREIGN KEY ("proposedJobId") REFERENCES "ProposedJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_permissionsId_fkey" FOREIGN KEY ("permissionsId") REFERENCES "WorkerPermissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAvailability" ADD CONSTRAINT "WorkerAvailability_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerAvailability" ADD CONSTRAINT "WorkerAvailability_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SummerJobEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Car" ADD CONSTRAINT "Car_forEventId_fkey" FOREIGN KEY ("forEventId") REFERENCES "SummerJobEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedJob" ADD CONSTRAINT "ProposedJob_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "Area"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinnedProposedJobByWorker" ADD CONSTRAINT "PinnedProposedJobByWorker_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinnedProposedJobByWorker" ADD CONSTRAINT "PinnedProposedJobByWorker_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ProposedJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveJob" ADD CONSTRAINT "ActiveJob_proposedJobId_fkey" FOREIGN KEY ("proposedJobId") REFERENCES "ProposedJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveJob" ADD CONSTRAINT "ActiveJob_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActiveJob" ADD CONSTRAINT "ActiveJob_responsibleWorkerId_fkey" FOREIGN KEY ("responsibleWorkerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_carId_fkey" FOREIGN KEY ("carId") REFERENCES "Car"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ride" ADD CONSTRAINT "Ride_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ActiveJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_summerJobEventId_fkey" FOREIGN KEY ("summerJobEventId") REFERENCES "SummerJobEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_summerJobEventId_fkey" FOREIGN KEY ("summerJobEventId") REFERENCES "SummerJobEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActiveJobToWorker" ADD CONSTRAINT "_ActiveJobToWorker_A_fkey" FOREIGN KEY ("A") REFERENCES "ActiveJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActiveJobToWorker" ADD CONSTRAINT "_ActiveJobToWorker_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RideToWorker" ADD CONSTRAINT "_RideToWorker_A_fkey" FOREIGN KEY ("A") REFERENCES "Ride"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RideToWorker" ADD CONSTRAINT "_RideToWorker_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

