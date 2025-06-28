-- AlterTable
ALTER TABLE "_ActiveJobToWorker" ADD CONSTRAINT "_ActiveJobToWorker_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_ActiveJobToWorker_AB_unique";

-- AlterTable
ALTER TABLE "_RideToWorker" ADD CONSTRAINT "_RideToWorker_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_RideToWorker_AB_unique";

-- CreateTable
CREATE TABLE "AdorationSlot" (
    "id" TEXT NOT NULL,
    "dateStart" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "length" INTEGER NOT NULL DEFAULT 60,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "AdorationSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SlotWorkers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SlotWorkers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SlotWorkers_B_index" ON "_SlotWorkers"("B");

-- AddForeignKey
ALTER TABLE "AdorationSlot" ADD CONSTRAINT "AdorationSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SummerJobEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SlotWorkers" ADD CONSTRAINT "_SlotWorkers_A_fkey" FOREIGN KEY ("A") REFERENCES "AdorationSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SlotWorkers" ADD CONSTRAINT "_SlotWorkers_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
