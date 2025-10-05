/*
  Warnings:

  - You are about to drop the `CliToken` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."CliToken" DROP CONSTRAINT "CliToken_deviceDetailId_fkey";

-- DropForeignKey
ALTER TABLE "public"."CliToken" DROP CONSTRAINT "CliToken_userId_fkey";

-- DropTable
DROP TABLE "public"."CliToken";

-- CreateTable
CREATE TABLE "CliSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresOn" TIMESTAMP(3) NOT NULL,
    "deviceDetailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CliSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CliSession_tokenHash_key" ON "CliSession"("tokenHash");

-- AddForeignKey
ALTER TABLE "CliSession" ADD CONSTRAINT "CliSession_deviceDetailId_fkey" FOREIGN KEY ("deviceDetailId") REFERENCES "DeviceDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CliSession" ADD CONSTRAINT "CliSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
