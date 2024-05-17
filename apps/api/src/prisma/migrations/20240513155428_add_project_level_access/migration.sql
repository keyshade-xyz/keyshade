/*
  Warnings:

  - You are about to drop the column `isPublic` on the `Project` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ProjectAccessLevel" AS ENUM ('GLOBAL', 'INTERNAL', 'PRIVATE');

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "isPublic",
ADD COLUMN     "accessLevel" "ProjectAccessLevel" NOT NULL DEFAULT 'PRIVATE';
