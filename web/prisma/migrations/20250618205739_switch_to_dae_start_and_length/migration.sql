/*
  Warnings:

  - You are about to drop the column `date` on the `AdorationSlot` table. All the data in the column will be lost.
  - Added the required column `dateStart` to the `AdorationSlot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AdorationSlot" DROP COLUMN "date",
ADD COLUMN     "dateStart" DATE NOT NULL;
