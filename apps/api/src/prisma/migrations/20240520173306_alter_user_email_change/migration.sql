/*
  Warnings:

  - A unique constraint covering the columns `[userId,otp]` on the table `UserEmailChange` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresOn` to the `UserEmailChange` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "UserEmailChange_userId_key";

-- AlterTable
ALTER TABLE "UserEmailChange" ADD COLUMN     "expiresOn" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "expiresOn" ON "UserEmailChange"("expiresOn");

-- CreateIndex
CREATE UNIQUE INDEX "UserEmailChange_userId_otp_key" ON "UserEmailChange"("userId", "otp");
