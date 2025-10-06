/*
  Warnings:

  - You are about to drop the column `deviceDetailId` on the `PersonalAccessToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PersonalAccessToken" DROP CONSTRAINT "PersonalAccessToken_deviceDetailId_fkey";

-- AlterTable
ALTER TABLE "PersonalAccessToken" DROP COLUMN "deviceDetailId";
