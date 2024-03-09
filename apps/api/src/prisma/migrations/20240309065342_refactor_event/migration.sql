/*
  Warnings:

  - The values [API_KEY,USER] on the enum `EventSource` will be removed. If these variants are still used in the database, this will fail.
  - The values [WORKSPACE_DELETED,API_KEY_UPDATED,API_KEY_DELETED,API_KEY_ADDED,USER_UPDATED] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `sourceApiKeyId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceApprovalId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceEnvironmentId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceProjectId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceSecretId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceUserId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceVariableId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceWorkspaceId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceWorkspaceMembershipId` on the `Event` table. All the data in the column will be lost.
  - You are about to drop the column `sourceWorkspaceRoleId` on the `Event` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventSource_new" AS ENUM ('SECRET', 'VARIABLE', 'ENVIRONMENT', 'PROJECT', 'WORKSPACE', 'WORKSPACE_ROLE', 'APPROVAL');
ALTER TABLE "Event" ALTER COLUMN "source" TYPE "EventSource_new" USING ("source"::text::"EventSource_new");
ALTER TYPE "EventSource" RENAME TO "EventSource_old";
ALTER TYPE "EventSource_new" RENAME TO "EventSource";
DROP TYPE "EventSource_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('INVITED_TO_WORKSPACE', 'REMOVED_FROM_WORKSPACE', 'ACCEPTED_INVITATION', 'DECLINED_INVITATION', 'CANCELLED_INVITATION', 'LEFT_WORKSPACE', 'WORKSPACE_MEMBERSHIP_UPDATED', 'WORKSPACE_UPDATED', 'WORKSPACE_CREATED', 'WORKSPACE_ROLE_CREATED', 'WORKSPACE_ROLE_UPDATED', 'WORKSPACE_ROLE_DELETED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'SECRET_UPDATED', 'SECRET_DELETED', 'SECRET_ADDED', 'VARIABLE_UPDATED', 'VARIABLE_DELETED', 'VARIABLE_ADDED', 'ENVIRONMENT_UPDATED', 'ENVIRONMENT_DELETED', 'ENVIRONMENT_ADDED', 'APPROVAL_CREATED', 'APPROVAL_UPDATED', 'APPROVAL_DELETED', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED');
ALTER TABLE "Event" ALTER COLUMN "type" TYPE "EventType_new" USING ("type"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceApiKeyId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceApprovalId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceEnvironmentId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceProjectId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceSecretId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceUserId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceVariableId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceWorkspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceWorkspaceMembershipId_fkey";

-- DropForeignKey
ALTER TABLE "Event" DROP CONSTRAINT "Event_sourceWorkspaceRoleId_fkey";

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "sourceApiKeyId",
DROP COLUMN "sourceApprovalId",
DROP COLUMN "sourceEnvironmentId",
DROP COLUMN "sourceProjectId",
DROP COLUMN "sourceSecretId",
DROP COLUMN "sourceUserId",
DROP COLUMN "sourceVariableId",
DROP COLUMN "sourceWorkspaceId",
DROP COLUMN "sourceWorkspaceMembershipId",
DROP COLUMN "sourceWorkspaceRoleId",
ADD COLUMN     "itemId" TEXT,
ADD COLUMN     "userId" TEXT,
ADD COLUMN     "workspaceId" TEXT;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;
