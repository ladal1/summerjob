/*
  Warnings:

  - A unique constraint covering the columns `[applicationId]` on the table `Worker` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Worker" ADD COLUMN     "applicationId" TEXT,
ADD COLUMN     "canBeMedic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otherAllergies" TEXT,
ADD COLUMN     "otherSkills" TEXT,
ADD COLUMN     "ownsCar" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Worker_applicationId_key" ON "Worker"("applicationId");

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
