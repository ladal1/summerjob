/*
  Warnings:

  - You are about to drop the column `allergens` on the `ProposedJob` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProposedJob" DROP COLUMN "allergens",
ADD COLUMN     "foodAllergies" "FoodAllergy"[],
ADD COLUMN     "workAllergies" "WorkAllergy"[];
