/*
  Warnings:

  - You are about to drop the column `hour` on the `AdorationSlot` table. All the data in the column will be lost.
  - You are about to drop the column `workerId` on the `AdorationSlot` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "AdorationSlot" DROP CONSTRAINT "AdorationSlot_workerId_fkey";

-- AlterTable
ALTER TABLE "AdorationSlot" DROP COLUMN "hour",
DROP COLUMN "workerId",
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "_SlotWorkers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SlotWorkers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SlotWorkers_B_index" ON "_SlotWorkers"("B");

-- AddForeignKey
ALTER TABLE "_SlotWorkers" ADD CONSTRAINT "_SlotWorkers_A_fkey" FOREIGN KEY ("A") REFERENCES "AdorationSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SlotWorkers" ADD CONSTRAINT "_SlotWorkers_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
