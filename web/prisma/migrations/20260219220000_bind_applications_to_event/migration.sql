-- DropIndex
DROP INDEX "Application_email_key";

-- AlterTable: add forEventId as nullable first
ALTER TABLE "Application" ADD COLUMN "forEventId" TEXT;

-- Backfill: set forEventId to the active event for all existing applications
UPDATE "Application" SET "forEventId" = (SELECT "id" FROM "SummerJobEvent" WHERE "isActive" = true LIMIT 1) WHERE "forEventId" IS NULL;

-- Make forEventId NOT NULL
ALTER TABLE "Application" ALTER COLUMN "forEventId" SET NOT NULL;

-- Change date columns to DATE type
ALTER TABLE "Application" ALTER COLUMN "birthDate" SET DATA TYPE DATE;
ALTER TABLE "Application" ALTER COLUMN "arrivalDate" SET DATA TYPE DATE;
ALTER TABLE "Application" ALTER COLUMN "departureDate" SET DATA TYPE DATE;

-- CreateIndex
CREATE UNIQUE INDEX "Application_email_forEventId_key" ON "Application"("email", "forEventId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_forEventId_fkey" FOREIGN KEY ("forEventId") REFERENCES "SummerJobEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
