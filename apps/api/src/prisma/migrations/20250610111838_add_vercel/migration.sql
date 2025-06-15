/*
  Warnings:

  - You are about to drop the column `environmentId` on the `Integration` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "IntegrationType" ADD VALUE 'VERCEL';

-- DropForeignKey
ALTER TABLE "Integration" DROP CONSTRAINT "Integration_environmentId_fkey";

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "metadata" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Integration" DROP COLUMN "environmentId";

-- CreateTable
CREATE TABLE "_EnvironmentToIntegration" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EnvironmentToIntegration_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EnvironmentToIntegration_B_index" ON "_EnvironmentToIntegration"("B");

-- AddForeignKey
ALTER TABLE "_EnvironmentToIntegration" ADD CONSTRAINT "_EnvironmentToIntegration_A_fkey" FOREIGN KEY ("A") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EnvironmentToIntegration" ADD CONSTRAINT "_EnvironmentToIntegration_B_fkey" FOREIGN KEY ("B") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
