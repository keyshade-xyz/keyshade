-- AlterTable
ALTER TABLE "Secret" ADD COLUMN     "requireRestart" BOOLEAN DEFAULT false;

-- AlterTable
ALTER TABLE "Variable" ADD COLUMN     "requireRestart" BOOLEAN NOT NULL DEFAULT false;
