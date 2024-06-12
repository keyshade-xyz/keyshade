/*
  Warnings:

  - The values [MANAGE_APPROVALS] on the enum `Authority` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPROVAL] on the enum `EventSource` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPROVAL_CREATED,APPROVAL_UPDATED,APPROVAL_DELETED,APPROVAL_APPROVED,APPROVAL_REJECTED] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.
  - The values [APPROVAL_CREATED,APPROVAL_UPDATED,APPROVAL_DELETED,APPROVAL_APPROVED,APPROVAL_REJECTED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isDefault` on the `Environment` table. All the data in the column will be lost.
  - You are about to drop the column `pendingCreation` on the `Environment` table. All the data in the column will be lost.
  - You are about to drop the column `pendingCreation` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `environmentId` on the `Secret` table. All the data in the column will be lost.
  - You are about to drop the column `pendingCreation` on the `Secret` table. All the data in the column will be lost.
  - You are about to drop the column `environmentId` on the `Variable` table. All the data in the column will be lost.
  - You are about to drop the column `pendingCreation` on the `Variable` table. All the data in the column will be lost.
  - You are about to drop the column `approvalEnabled` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the `Approval` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[projectId,name]` on the table `Environment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,name]` on the table `Secret` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,name]` on the table `Variable` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `environmentId` to the `SecretVersion` table without a default value. This is not possible if the table is not empty.
  - Added the required column `environmentId` to the `VariableVersion` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Authority_new" AS ENUM ('CREATE_PROJECT', 'READ_USERS', 'ADD_USER', 'REMOVE_USER', 'UPDATE_USER_ROLE', 'READ_WORKSPACE', 'UPDATE_WORKSPACE', 'DELETE_WORKSPACE', 'CREATE_WORKSPACE_ROLE', 'READ_WORKSPACE_ROLE', 'UPDATE_WORKSPACE_ROLE', 'DELETE_WORKSPACE_ROLE', 'WORKSPACE_ADMIN', 'READ_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT', 'CREATE_SECRET', 'READ_SECRET', 'UPDATE_SECRET', 'DELETE_SECRET', 'CREATE_ENVIRONMENT', 'READ_ENVIRONMENT', 'UPDATE_ENVIRONMENT', 'DELETE_ENVIRONMENT', 'CREATE_VARIABLE', 'READ_VARIABLE', 'UPDATE_VARIABLE', 'DELETE_VARIABLE', 'CREATE_INTEGRATION', 'READ_INTEGRATION', 'UPDATE_INTEGRATION', 'DELETE_INTEGRATION', 'CREATE_WORKSPACE', 'CREATE_API_KEY', 'READ_API_KEY', 'UPDATE_API_KEY', 'DELETE_API_KEY', 'UPDATE_PROFILE', 'READ_SELF', 'UPDATE_SELF', 'READ_EVENT');
ALTER TABLE "WorkspaceRole" ALTER COLUMN "authorities" TYPE "Authority_new"[] USING ("authorities"::text::"Authority_new"[]);
ALTER TABLE "ApiKey" ALTER COLUMN "authorities" TYPE "Authority_new"[] USING ("authorities"::text::"Authority_new"[]);
ALTER TYPE "Authority" RENAME TO "Authority_old";
ALTER TYPE "Authority_new" RENAME TO "Authority";
DROP TYPE "Authority_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EventSource_new" AS ENUM ('SECRET', 'VARIABLE', 'ENVIRONMENT', 'PROJECT', 'WORKSPACE', 'WORKSPACE_ROLE', 'INTEGRATION');
ALTER TABLE "Event" ALTER COLUMN "source" TYPE "EventSource_new" USING ("source"::text::"EventSource_new");
ALTER TYPE "EventSource" RENAME TO "EventSource_old";
ALTER TYPE "EventSource_new" RENAME TO "EventSource";
DROP TYPE "EventSource_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('INVITED_TO_WORKSPACE', 'REMOVED_FROM_WORKSPACE', 'ACCEPTED_INVITATION', 'DECLINED_INVITATION', 'CANCELLED_INVITATION', 'LEFT_WORKSPACE', 'WORKSPACE_MEMBERSHIP_UPDATED', 'WORKSPACE_UPDATED', 'WORKSPACE_CREATED', 'WORKSPACE_ROLE_CREATED', 'WORKSPACE_ROLE_UPDATED', 'WORKSPACE_ROLE_DELETED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'SECRET_UPDATED', 'SECRET_DELETED', 'SECRET_ADDED', 'VARIABLE_UPDATED', 'VARIABLE_DELETED', 'VARIABLE_ADDED', 'ENVIRONMENT_UPDATED', 'ENVIRONMENT_DELETED', 'ENVIRONMENT_ADDED', 'INTEGRATION_ADDED', 'INTEGRATION_UPDATED', 'INTEGRATION_DELETED');
ALTER TABLE "Event" ALTER COLUMN "type" TYPE "EventType_new" USING ("type"::text::"EventType_new");
ALTER TABLE "Integration" ALTER COLUMN "notifyOn" TYPE "EventType_new"[] USING ("notifyOn"::text::"EventType_new"[]);
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('INVITED_TO_PROJECT', 'REMOVED_FROM_PROJECT', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'SECRET_UPDATED', 'SECRET_DELETED', 'SECRET_ADDED', 'API_KEY_UPDATED', 'API_KEY_DELETED', 'API_KEY_ADDED', 'ENVIRONMENT_UPDATED', 'ENVIRONMENT_DELETED', 'ENVIRONMENT_ADDED', 'VARIABLE_UPDATED', 'VARIABLE_DELETED', 'VARIABLE_ADDED');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_approvedById_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_rejectedById_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_requestedById_fkey";

-- DropForeignKey
ALTER TABLE "Approval" DROP CONSTRAINT "Approval_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Secret" DROP CONSTRAINT "Secret_environmentId_fkey";

-- DropForeignKey
ALTER TABLE "Variable" DROP CONSTRAINT "Variable_environmentId_fkey";

-- DropIndex
DROP INDEX "SecretVersion_secretId_version_key";

-- DropIndex
DROP INDEX "VariableVersion_variableId_version_key";

-- AlterTable
ALTER TABLE "Environment" DROP COLUMN "isDefault",
DROP COLUMN "pendingCreation";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "pendingCreation";

-- AlterTable
ALTER TABLE "Secret" DROP COLUMN "environmentId",
DROP COLUMN "pendingCreation";

-- AlterTable
ALTER TABLE "SecretVersion" ADD COLUMN     "environmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Variable" DROP COLUMN "environmentId",
DROP COLUMN "pendingCreation";

-- AlterTable
ALTER TABLE "VariableVersion" ADD COLUMN     "environmentId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "approvalEnabled";

-- DropTable
DROP TABLE "Approval";

-- DropEnum
DROP TYPE "ApprovalAction";

-- DropEnum
DROP TYPE "ApprovalItemType";

-- DropEnum
DROP TYPE "ApprovalStatus";

-- CreateIndex
CREATE INDEX "Environment_name_idx" ON "Environment"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Environment_projectId_name_key" ON "Environment"("projectId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Secret_projectId_name_key" ON "Secret"("projectId", "name");

-- CreateIndex
CREATE INDEX "SecretVersion_secretId_environmentId_idx" ON "SecretVersion"("secretId", "environmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Variable_projectId_name_key" ON "Variable"("projectId", "name");

-- CreateIndex
CREATE INDEX "VariableVersion_variableId_environmentId_idx" ON "VariableVersion"("variableId", "environmentId");

-- AddForeignKey
ALTER TABLE "SecretVersion" ADD CONSTRAINT "SecretVersion_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableVersion" ADD CONSTRAINT "VariableVersion_environmentId_fkey" FOREIGN KEY ("environmentId") REFERENCES "Environment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
