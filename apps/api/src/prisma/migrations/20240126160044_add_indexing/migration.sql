/*
  Warnings:

  - A unique constraint covering the columns `[userId,code]` on the table `Otp` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "expiresAt" ON "Otp"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Otp_userId_code_key" ON "Otp"("userId", "code");

-- CreateIndex
CREATE INDEX "email" ON "User"("email");
