/*
  Warnings:

  - You are about to drop the column `allergens` on the `ProposedJob` table. All the data in the column will be lost.
  - You are about to drop the column `workAllergies` on the `Worker` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ProposedJob" DROP COLUMN "allergens";

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "workAllergies";

-- DropEnum
DROP TYPE "Allergy";

-- DropEnum
DROP TYPE "WorkAllergy";

-- CreateTable
CREATE TABLE "WorkAllergy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "WorkAllergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkAllergyToWorker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WorkAllergyToWorker_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ProposedJobToWorkAllergy" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProposedJobToWorkAllergy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkAllergy_name_key" ON "WorkAllergy"("name");

-- CreateIndex
CREATE INDEX "_WorkAllergyToWorker_B_index" ON "_WorkAllergyToWorker"("B");

-- CreateIndex
CREATE INDEX "_ProposedJobToWorkAllergy_B_index" ON "_ProposedJobToWorkAllergy"("B");

-- AddForeignKey
ALTER TABLE "_WorkAllergyToWorker" ADD CONSTRAINT "_WorkAllergyToWorker_A_fkey" FOREIGN KEY ("A") REFERENCES "WorkAllergy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkAllergyToWorker" ADD CONSTRAINT "_WorkAllergyToWorker_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProposedJobToWorkAllergy" ADD CONSTRAINT "_ProposedJobToWorkAllergy_A_fkey" FOREIGN KEY ("A") REFERENCES "ProposedJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProposedJobToWorkAllergy" ADD CONSTRAINT "_ProposedJobToWorkAllergy_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkAllergy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
