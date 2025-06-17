/*
  Warnings:

  - A unique constraint covering the columns `[referralCode]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `referralCode` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralCode" TEXT NOT NULL,
ADD COLUMN     "referredById" TEXT;

-- CreateTable
CREATE TABLE "OnboardingAnswers" (
    "id" TEXT NOT NULL,
    "role" TEXT,
    "industry" TEXT,
    "teamSize" TEXT,
    "productStage" TEXT,
    "useCase" TEXT,
    "heardFrom" TEXT,
    "wouldLikeToRefer" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "OnboardingAnswers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingAnswers_userId_key" ON "OnboardingAnswers"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingAnswers" ADD CONSTRAINT "OnboardingAnswers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
