/*
  Warnings:

  - You are about to drop the column `allergies` on the `Worker` table. All the data in the column will be lost.
  - You are about to drop the column `otherAllergies` on the `Worker` table. All the data in the column will be lost.
  - You are about to drop the column `otherSkills` on the `Worker` table. All the data in the column will be lost.
  - The `skills` column on the `Worker` table would be dropped and recreated. This will lead to data loss if there is data in the column.

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
ALTER TABLE "Worker" DROP COLUMN "allergies",
DROP COLUMN "otherAllergies",
DROP COLUMN "otherSkills",
ADD COLUMN     "foodAllergies" "FoodAllergy"[],
ADD COLUMN     "tools" "SkillBrings"[],
ADD COLUMN     "workAllergies" "WorkAllergy"[],
DROP COLUMN "skills",
ADD COLUMN     "skills" "SkillHas"[];
