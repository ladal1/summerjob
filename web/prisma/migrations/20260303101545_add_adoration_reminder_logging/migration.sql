-- CreateTable
CREATE TABLE "AdorationReminderLogging" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "adorationSlotId" TEXT NOT NULL,

    CONSTRAINT "AdorationReminderLogging_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdorationReminderLogging_workerId_adorationSlotId_key" ON "AdorationReminderLogging"("workerId", "adorationSlotId");
