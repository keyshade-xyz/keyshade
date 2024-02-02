/*
  Warnings:

  - A unique constraint covering the columns `[isDefault,ownerId]` on the table `Workspace` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Environment" DROP CONSTRAINT "Environment_lastUpdatedById_fkey";

-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_lastUpdatedById_fkey";

-- AlterTable
ALTER TABLE "Environment" ALTER COLUMN "lastUpdatedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "lastUpdatedById" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_isDefault_ownerId_key" ON "Workspace"("isDefault", "ownerId");

-- AddForeignKey
ALTER TABLE "Environment" ADD CONSTRAINT "Environment_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
