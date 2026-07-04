-- CreateEnum
CREATE TYPE "ColorTag" AS ENUM ('YELLOW', 'GREEN', 'RED', 'PURPLE', 'BLUE', 'ORANGE');

-- AlterTable
ALTER TABLE "ProposedJob" ADD COLUMN     "colorTags" "ColorTag"[] DEFAULT ARRAY[]::"ColorTag"[];

-- AlterTable
ALTER TABLE "Worker" ADD COLUMN     "colorTags" "ColorTag"[] DEFAULT ARRAY[]::"ColorTag"[];
