/*
  Warnings:

  - You are about to drop the column `noOfReminderSent` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "noOfReminderSent",
ADD COLUMN     "timesRemindedForOnboarding" INTEGER NOT NULL DEFAULT 0;
