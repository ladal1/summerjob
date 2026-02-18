/*
  Warnings:

  - You are about to drop the column `jobType` on the `ProposedJob` table. All the data in the column will be lost.
  - You are about to drop the column `tool` on the `Tool` table. All the data in the column will be lost.
  - You are about to drop the column `skills` on the `Worker` table. All the data in the column will be lost.
  - You are about to drop the column `tools` on the `Worker` table. All the data in the column will be lost.
  - Added the required column `toolNameId` to the `Tool` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProposedJob" DROP COLUMN "jobType",
ADD COLUMN     "jobTypeId" TEXT;

-- AlterTable
ALTER TABLE "Tool" DROP COLUMN "tool",
ADD COLUMN     "toolNameId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Worker" DROP COLUMN "skills",
DROP COLUMN "tools";

-- DropEnum
DROP TYPE "JobType";

-- DropEnum
DROP TYPE "SkillBrings";

-- DropEnum
DROP TYPE "SkillHas";

-- DropEnum
DROP TYPE "ToolName";

-- CreateTable
CREATE TABLE "SkillHas" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SkillHas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "JobType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolName" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ToolName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SkillHasToWorker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SkillHasToWorker_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SkillHasToToolName" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SkillHasToToolName_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_JobTypeToToolName" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobTypeToToolName_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ToolNameToWorker" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ToolNameToWorker_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "SkillHas_name_key" ON "SkillHas"("name");

-- CreateIndex
CREATE UNIQUE INDEX "JobType_name_key" ON "JobType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ToolName_name_key" ON "ToolName"("name");

-- CreateIndex
CREATE INDEX "_SkillHasToWorker_B_index" ON "_SkillHasToWorker"("B");

-- CreateIndex
CREATE INDEX "_SkillHasToToolName_B_index" ON "_SkillHasToToolName"("B");

-- CreateIndex
CREATE INDEX "_JobTypeToToolName_B_index" ON "_JobTypeToToolName"("B");

-- CreateIndex
CREATE INDEX "_ToolNameToWorker_B_index" ON "_ToolNameToWorker"("B");

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_toolNameId_fkey" FOREIGN KEY ("toolNameId") REFERENCES "ToolName"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProposedJob" ADD CONSTRAINT "ProposedJob_jobTypeId_fkey" FOREIGN KEY ("jobTypeId") REFERENCES "JobType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SkillHasToWorker" ADD CONSTRAINT "_SkillHasToWorker_A_fkey" FOREIGN KEY ("A") REFERENCES "SkillHas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SkillHasToWorker" ADD CONSTRAINT "_SkillHasToWorker_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SkillHasToToolName" ADD CONSTRAINT "_SkillHasToToolName_A_fkey" FOREIGN KEY ("A") REFERENCES "SkillHas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SkillHasToToolName" ADD CONSTRAINT "_SkillHasToToolName_B_fkey" FOREIGN KEY ("B") REFERENCES "ToolName"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobTypeToToolName" ADD CONSTRAINT "_JobTypeToToolName_A_fkey" FOREIGN KEY ("A") REFERENCES "JobType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobTypeToToolName" ADD CONSTRAINT "_JobTypeToToolName_B_fkey" FOREIGN KEY ("B") REFERENCES "ToolName"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ToolNameToWorker" ADD CONSTRAINT "_ToolNameToWorker_A_fkey" FOREIGN KEY ("A") REFERENCES "ToolName"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ToolNameToWorker" ADD CONSTRAINT "_ToolNameToWorker_B_fkey" FOREIGN KEY ("B") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;
