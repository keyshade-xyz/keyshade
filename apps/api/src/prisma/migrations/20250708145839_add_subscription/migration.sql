/*
  Warnings:

  - You are about to drop the column `isDisabled` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `Subscription` table. All the data in the column will be lost.
  - The `plan` column on the `Subscription` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[workspaceId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `workspaceId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubscriptionPlanType" AS ENUM ('FREE', 'HACKER', 'TEAM', 'ENTERPRISE');

-- DropIndex
DROP INDEX "Subscription_userId_key";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "isDisabled";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "isActive",
ADD COLUMN     "activatedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isAnnual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "renewsOn" TIMESTAMP(3),
ADD COLUMN     "seatsBooked" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "trialActivatedOn" TIMESTAMP(3),
ADD COLUMN     "trialPlan" "SubscriptionPlanType",
ADD COLUMN     "workspaceId" TEXT NOT NULL,
DROP COLUMN "plan",
ADD COLUMN     "plan" "SubscriptionPlanType" NOT NULL DEFAULT 'FREE';

-- AlterTable
ALTER TABLE "Workspace" ADD COLUMN     "isDisabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workspaceLockdownIn" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_workspaceId_key" ON "Subscription"("workspaceId");

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
