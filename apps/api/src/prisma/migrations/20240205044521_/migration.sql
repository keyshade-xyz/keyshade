/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,hasAdminAuthority]` on the table `WorkspaceRole` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceRole_workspaceId_hasAdminAuthority_key" ON "WorkspaceRole"("workspaceId", "hasAdminAuthority");
