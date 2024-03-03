/*
  Warnings:

  - A unique constraint covering the columns `[workspaceId,name]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ApprovalItemType" AS ENUM ('SECRET', 'VARIABLE', 'ENVIRONMENT', 'PROJECT', 'WORKSPACE');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- AlterEnum
ALTER TYPE "Authority" ADD VALUE 'MANAGE_APPROVALS';

-- AlterEnum
ALTER TYPE "EventSource" ADD VALUE 'APPROVAL';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "EventType" ADD VALUE 'APPROVAL_CREATED';
ALTER TYPE "EventType" ADD VALUE 'APPROVAL_UPDATED';
ALTER TYPE "EventType" ADD VALUE 'APPROVAL_DELETED';
ALTER TYPE "EventType" ADD VALUE 'APPROVAL_APPROVED';
ALTER TYPE "EventType" ADD VALUE 'APPROVAL_REJECTED';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'APPROVAL_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'APPROVAL_UPDATED';
ALTER TYPE "NotificationType" ADD VALUE 'APPROVAL_DELETED';
ALTER TYPE "NotificationType" ADD VALUE 'APPROVAL_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'APPROVAL_REJECTED';

-- AlterTable
ALTER TABLE "Environment" ADD COLUMN     "pendingCreation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "sourceApprovalId" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "pendingCreation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Secret" ADD COLUMN     "pendingCreation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Variable" ADD COLUMN     "pendingCreation" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "approvalEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pendingCreation" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "itemType" "ApprovalItemType" NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "action" "ApprovalAction" NOT NULL,
    "metadata" JSONB NOT NULL,
    "itemId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "requestedById" TEXT,
    "approvedById" TEXT,
    "rejectedById" TEXT,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Approval_itemType_itemId_idx" ON "Approval"("itemType", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_workspaceId_name_key" ON "Project"("workspaceId", "name");

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceApprovalId_fkey" FOREIGN KEY ("sourceApprovalId") REFERENCES "Approval"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
