/*
  Warnings:

  - You are about to drop the column `workAllergies` on the `ProposedJob` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProposedJob" DROP COLUMN "workAllergies",
ADD COLUMN     "allergens" "WorkAllergy"[];
