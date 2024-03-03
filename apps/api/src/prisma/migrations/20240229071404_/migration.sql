/*
  Warnings:

  - You are about to drop the column `workspaceRoleId` on the `Project` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_workspaceRoleId_fkey";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "workspaceRoleId";

-- CreateTable
CREATE TABLE "ProjectWorkspaceRoleAssociation" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,

    CONSTRAINT "ProjectWorkspaceRoleAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectWorkspaceRoleAssociation_roleId_projectId_key" ON "ProjectWorkspaceRoleAssociation"("roleId", "projectId");

-- AddForeignKey
ALTER TABLE "ProjectWorkspaceRoleAssociation" ADD CONSTRAINT "ProjectWorkspaceRoleAssociation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "WorkspaceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectWorkspaceRoleAssociation" ADD CONSTRAINT "ProjectWorkspaceRoleAssociation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
