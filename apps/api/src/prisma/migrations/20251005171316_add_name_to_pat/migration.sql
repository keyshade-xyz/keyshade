/*
  Warnings:

  - Added the required column `name` to the `PersonalAccessToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PersonalAccessToken" ADD COLUMN     "name" TEXT NOT NULL;
