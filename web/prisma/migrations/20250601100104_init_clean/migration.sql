/*
  Warnings:

  - The `allergens` column on the `ProposedJob` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `allergies` on the `Worker` table. All the data in the column will be lost.
  - The `skills` column on the `Worker` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[applicationId]` on the table `Worker` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SkillHas" AS ENUM ('LUMBERJACK', 'ARTIST', 'GARDENER', 'DANGER', 'ELECTRICIAN', 'HEIGHTS', 'MASON', 'OTHER');

-- CreateEnum
CREATE TYPE "SkillBrings" AS ENUM ('AXE', 'SHOVEL', 'SAW', 'POWERTOOLS', 'LADDER', 'OTHER');

-- CreateEnum
CREATE TYPE "FoodAllergy" AS ENUM ('LACTOSE', 'GLUTEN', 'NUTS', 'SEAFOOD', 'EGG', 'OTHER');

-- CreateEnum
CREATE TYPE "WorkAllergy" AS ENUM ('DUST', 'ANIMALS', 'HAY', 'POLLEN', 'MITES', 'CHEMICALS', 'OTHER');

-- AlterTable
ALTER TABLE "ProposedJob" DROP COLUMN "allergens",
ADD COLUMN     "allergens" "WorkAllergy"[];

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "allergies",
ADD COLUMN     "applicationId" TEXT,
ADD COLUMN     "canBeMedic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "foodAllergies" "FoodAllergy"[],
ADD COLUMN     "ownsCar" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tools" "SkillBrings"[],
ADD COLUMN     "workAllergies" "WorkAllergy"[],
DROP COLUMN "skills",
ADD COLUMN     "skills" "SkillHas"[];

-- DropEnum
DROP TYPE "Skill";

-- CreateIndex
CREATE UNIQUE INDEX "Worker_applicationId_key" ON "Worker"("applicationId");

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
