-- AlterTable
ALTER TABLE "SummerJobEvent" ADD COLUMN     "applicationPasswordHash" TEXT,
ADD COLUMN     "isPasswordProtected" BOOLEAN NOT NULL DEFAULT false;
