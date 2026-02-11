/*
  Warnings:

  - You are about to drop the column `foodAllergies` on the `Worker` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "foodAllergies";

-- DropEnum
DROP TYPE "FoodAllergy";

-- CreateTable
CREATE TABLE "FoodAllergy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FoodAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FoodAllergyToWorker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FoodAllergyToWorker_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodAllergy_name_key" ON "FoodAllergy"("name");

-- CreateIndex
CREATE INDEX "_FoodAllergyToWorker_B_index" ON "_FoodAllergyToWorker"("B");

-- AddForeignKey
ALTER TABLE "_FoodAllergyToWorker" ADD CONSTRAINT "_FoodAllergyToWorker_A_fkey" FOREIGN KEY ("A") REFERENCES "FoodAllergy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FoodAllergyToWorker" ADD CONSTRAINT "_FoodAllergyToWorker_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
