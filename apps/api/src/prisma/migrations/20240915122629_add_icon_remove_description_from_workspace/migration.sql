/*
  Warnings:

  - You are about to drop the column `description` on the `Workspace` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "description",
ADD COLUMN     "icon" TEXT;
