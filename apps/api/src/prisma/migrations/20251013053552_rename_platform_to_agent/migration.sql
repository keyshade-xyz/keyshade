/*
  Warnings:

  - You are about to drop the column `platform` on the `DeviceDetail` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."DeviceDetail_encryptedIpAddress_os_platform_idx";

-- AlterTable
ALTER TABLE "DeviceDetail" DROP COLUMN "platform",
ADD COLUMN     "agent" TEXT;

-- CreateIndex
CREATE INDEX "DeviceDetail_encryptedIpAddress_os_agent_idx" ON "DeviceDetail"("encryptedIpAddress", "os", "agent");
