/*
  Warnings:

  - You are about to drop the column `ipAddress` on the `LoginSession` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId,ipHash,browser]` on the table `LoginSession` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ipHash` to the `LoginSession` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "LoginSession_userId_ipAddress_browser_key";

-- AlterTable
ALTER TABLE "LoginSession" DROP COLUMN "ipAddress",
ADD COLUMN     "ipHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "LoginSession_userId_ipHash_browser_key" ON "LoginSession"("userId", "ipHash", "browser");
