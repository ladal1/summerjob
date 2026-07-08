-- AlterTable
ALTER TABLE "Area" ADD COLUMN "managerId" TEXT;

-- AddForeignKey
ALTER TABLE "Area" ADD CONSTRAINT "Area_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
