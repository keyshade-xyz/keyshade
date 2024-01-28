-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_lastUpdatedById_fkey";

-- AlterTable
ALTER TABLE "Workspace" ALTER COLUMN "lastUpdatedById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
