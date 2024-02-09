/*
  Warnings:

  - You are about to drop the column `generalRoles` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `isDefault` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `WorkspaceMember` table. All the data in the column will be lost.
  - You are about to drop the `ApiKeyWorkspaceScope` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name,ownerId]` on the table `Workspace` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `ApiKey` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Authority" AS ENUM ('CREATE_PROJECT', 'READ_USERS', 'ADD_USER', 'REMOVE_USER', 'UPDATE_USER_ROLE', 'READ_WORKSPACE', 'UPDATE_WORKSPACE', 'DELETE_WORKSPACE', 'TRANSFER_OWNERSHIP', 'CREATE_WORKSPACE_ROLE', 'READ_WORKSPACE_ROLE', 'UPDATE_WORKSPACE_ROLE', 'DELETE_WORKSPACE_ROLE', 'WORKSPACE_ADMIN', 'READ_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT', 'CREATE_SECRET', 'READ_SECRET', 'UPDATE_SECRET', 'DELETE_SECRET', 'CREATE_ENVIRONMENT', 'READ_ENVIRONMENT', 'UPDATE_ENVIRONMENT', 'DELETE_ENVIRONMENT', 'CREATE_WORKSPACE', 'CREATE_API_KEY', 'READ_API_KEY', 'UPDATE_API_KEY', 'DELETE_API_KEY', 'UPDATE_PROFILE');

-- DropForeignKey
ALTER TABLE "ApiKeyWorkspaceScope" DROP CONSTRAINT "ApiKeyWorkspaceScope_apiKeyId_fkey";

-- DropForeignKey
ALTER TABLE "ApiKeyWorkspaceScope" DROP CONSTRAINT "ApiKeyWorkspaceScope_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_lastUpdatedById_fkey";

-- DropForeignKey
ALTER TABLE "Secret" DROP CONSTRAINT "Secret_lastUpdatedById_fkey";

-- DropForeignKey
ALTER TABLE "SecretVersion" DROP CONSTRAINT "SecretVersion_createdById_fkey";

-- DropIndex
DROP INDEX "Workspace_isDefault_ownerId_key";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "generalRoles",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "apiKeyWorkspaceAuthorityId" TEXT,
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workspaceRoleId" TEXT,
ALTER COLUMN "lastUpdatedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Secret" ALTER COLUMN "lastUpdatedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SecretVersion" ALTER COLUMN "createdById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "isDefault";

-- AlterTable
ALTER TABLE "WorkspaceMember" DROP COLUMN "role";

-- DropTable
DROP TABLE "ApiKeyWorkspaceScope";

-- DropEnum
DROP TYPE "ApiKeyGeneralRole";

-- DropEnum
DROP TYPE "ApiKeyWorkspaceRole";

-- DropEnum
DROP TYPE "WorkspaceRole";

-- CreateTable
CREATE TABLE "WorkspaceRole" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "colorCode" TEXT,
    "hasAdminAuthority" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorities" "Authority"[],
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "WorkspaceRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMemberRoleAssociation" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "workspaceMemberId" TEXT NOT NULL,

    CONSTRAINT "WorkspaceMemberRoleAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceRole_workspaceId_name_key" ON "WorkspaceRole"("workspaceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMemberRoleAssociation_roleId_workspaceMemberId_key" ON "WorkspaceMemberRoleAssociation"("roleId", "workspaceMemberId");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_name_ownerId_key" ON "Workspace"("name", "ownerId");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_workspaceRoleId_fkey" FOREIGN KEY ("workspaceRoleId") REFERENCES "WorkspaceRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceRole" ADD CONSTRAINT "WorkspaceRole_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMemberRoleAssociation" ADD CONSTRAINT "WorkspaceMemberRoleAssociation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "WorkspaceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMemberRoleAssociation" ADD CONSTRAINT "WorkspaceMemberRoleAssociation_workspaceMemberId_fkey" FOREIGN KEY ("workspaceMemberId") REFERENCES "WorkspaceMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretVersion" ADD CONSTRAINT "SecretVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
