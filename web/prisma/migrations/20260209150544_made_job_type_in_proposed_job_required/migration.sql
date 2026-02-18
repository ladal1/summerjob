/*
  Warnings:

  - Made the column `jobTypeId` on table `ProposedJob` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "ProposedJob" DROP CONSTRAINT "ProposedJob_jobTypeId_fkey";

-- AlterTable
ALTER TABLE "ProposedJob" ALTER COLUMN "jobTypeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "ProposedJob" ADD CONSTRAINT "ProposedJob_jobTypeId_fkey" FOREIGN KEY ("jobTypeId") REFERENCES "JobType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
