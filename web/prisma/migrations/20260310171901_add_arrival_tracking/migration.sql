-- AlterTable
ALTER TABLE "WorkerAvailability" ADD COLUMN     "arrived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "show" BOOLEAN NOT NULL DEFAULT true;
