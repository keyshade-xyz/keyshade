-- CreateEnum
CREATE TYPE "IntegrationType" AS ENUM ('DISCORD', 'SLACK', 'GITHUB', 'GITLAB');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Authority" ADD VALUE 'CREATE_INTEGRATION';
ALTER TYPE "Authority" ADD VALUE 'READ_INTEGRATION';
ALTER TYPE "Authority" ADD VALUE 'UPDATE_INTEGRATION';
ALTER TYPE "Authority" ADD VALUE 'DELETE_INTEGRATION';

-- AlterEnum
ALTER TYPE "EventSource" ADD VALUE 'INTEGRATION';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'INTEGRATION_ADDED';
ALTER TYPE "EventType" ADD VALUE 'INTEGRATION_UPDATED';
ALTER TYPE "EventType" ADD VALUE 'INTEGRATION_DELETED';

-- CreateTable
CREATE TABLE "Integration" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "type" "IntegrationType" NOT NULL,
    "notifyOn" "EventType"[],
    "workspaceId" TEXT NOT NULL,
    "projectId" TEXT,
    "environmentId" TEXT,

    CONSTRAINT "Integration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Integration_workspaceId_name_key" ON "Integration"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
