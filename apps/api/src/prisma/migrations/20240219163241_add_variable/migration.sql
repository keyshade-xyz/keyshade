-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Authority" ADD VALUE 'CREATE_VARIABLE';
ALTER TYPE "Authority" ADD VALUE 'READ_VARIABLE';
ALTER TYPE "Authority" ADD VALUE 'UPDATE_VARIABLE';
ALTER TYPE "Authority" ADD VALUE 'DELETE_VARIABLE';

-- AlterEnum
ALTER TYPE "EventSource" ADD VALUE 'VARIABLE';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'VARIABLE_UPDATED';
ALTER TYPE "EventType" ADD VALUE 'VARIABLE_DELETED';
ALTER TYPE "EventType" ADD VALUE 'VARIABLE_ADDED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'VARIABLE_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'VARIABLE_DELETED';
ALTER TYPE "NotificationType" ADD VALUE 'VARIABLE_ADDED';

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "sourceVariableId" TEXT;

-- CreateTable
CREATE TABLE "VariableVersion" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "variableId" TEXT NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT,

    CONSTRAINT "VariableVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Variable" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedById" TEXT,
    "projectId" TEXT NOT NULL,
    "environmentId" TEXT NOT NULL,

    CONSTRAINT "Variable_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VariableVersion_variableId_version_key" ON "VariableVersion"("variableId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Variable_projectId_environmentId_name_key" ON "Variable"("projectId", "environmentId", "name");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceVariableId_fkey" FOREIGN KEY ("sourceVariableId") REFERENCES "Variable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableVersion" ADD CONSTRAINT "VariableVersion_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "Variable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableVersion" ADD CONSTRAINT "VariableVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variable" ADD CONSTRAINT "Variable_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variable" ADD CONSTRAINT "Variable_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Variable" ADD CONSTRAINT "Variable_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
