/*
  Warnings:

  - The required column `id` was added to the `Otp` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Otp_pkey" PRIMARY KEY ("id");

-- CreateTable
CREATE TABLE "UserEmailChange" (
    "id" TEXT NOT NULL,
    "otpId" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,

    CONSTRAINT "UserEmailChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserEmailChange_otpId_key" ON "UserEmailChange"("otpId");

-- AddForeignKey
ALTER TABLE "UserEmailChange" ADD CONSTRAINT "UserEmailChange_otpId_fkey" FOREIGN KEY ("otpId") REFERENCES "Otp"("id") ON DELETE CASCADE ON UPDATE CASCADE;
