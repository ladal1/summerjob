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
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "location" TEXT NOT NULL,
    "workerId" TEXT,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "AdorationSlot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AdorationSlot" ADD CONSTRAINT "AdorationSlot_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdorationSlot" ADD CONSTRAINT "AdorationSlot_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "SummerJobEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
