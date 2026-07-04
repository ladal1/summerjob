-- AddForeignKey
ALTER TABLE "AdorationReminderLogging" ADD CONSTRAINT "AdorationReminderLogging_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdorationReminderLogging" ADD CONSTRAINT "AdorationReminderLogging_adorationSlotId_fkey" FOREIGN KEY ("adorationSlotId") REFERENCES "AdorationSlot"("id") ON DELETE CASCADE ON UPDATE CASCADE;
