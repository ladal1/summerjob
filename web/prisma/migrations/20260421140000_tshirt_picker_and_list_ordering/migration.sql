-- CreateTable
CREATE TABLE "TShirtSize" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TShirtSize_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TShirtColor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TShirtColor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TShirtSize_name_key" ON "TShirtSize"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TShirtColor_name_key" ON "TShirtColor"("name");

-- AlterTable
ALTER TABLE "Application" ADD COLUMN "wantsTShirt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Application" ADD COLUMN "tShirtSizeId" TEXT;
ALTER TABLE "Application" ADD COLUMN "tShirtColorId" TEXT;

-- AlterTable
ALTER TABLE "SummerJobEvent" ADD COLUMN "tShirtPrice" INTEGER;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_tShirtSizeId_fkey" FOREIGN KEY ("tShirtSizeId") REFERENCES "TShirtSize"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_tShirtColorId_fkey" FOREIGN KEY ("tShirtColorId") REFERENCES "TShirtColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "FoodAllergy" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "WorkAllergy" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "SkillHas" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "JobType" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ToolName" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;
