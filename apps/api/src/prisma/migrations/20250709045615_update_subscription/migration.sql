/*
  Warnings:

  - You are about to drop the column `trialActivatedOn` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `trialPlan` on the `Subscription` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'UNPAID');

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "trialActivatedOn",
DROP COLUMN "trialPlan",
ADD COLUMN     "status" "SubscriptionStatus" NOT NULL DEFAULT 'INCOMPLETE',
ADD COLUMN     "vendorSubscriptionId" TEXT;
