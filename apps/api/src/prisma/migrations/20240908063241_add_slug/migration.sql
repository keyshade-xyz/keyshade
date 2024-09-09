/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `ApiKey` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Environment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Integration` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Secret` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Variable` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Workspace` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `WorkspaceRole` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `ApiKey` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Environment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Integration` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Secret` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Variable` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `Workspace` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `WorkspaceRole` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Environment" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Secret" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Variable" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "WorkspaceRole" ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_slug_key" ON "ApiKey"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Environment_slug_key" ON "Environment"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Integration_slug_key" ON "Integration"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "Project"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Secret_slug_key" ON "Secret"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Variable_slug_key" ON "Variable"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceRole_slug_key" ON "WorkspaceRole"("slug");
