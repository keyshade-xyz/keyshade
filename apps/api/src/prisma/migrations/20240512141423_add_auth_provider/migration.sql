-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'GITHUB', 'GITLAB', 'EMAIL_OTP');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authProvider" "AuthProvider";
