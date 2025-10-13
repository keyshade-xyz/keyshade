/*
  Warnings:

  - You are about to drop the `ApiKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LoginSession` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ApiKey" DROP CONSTRAINT "ApiKey_userId_fkey";

-- DropForeignKey
ALTER TABLE "public"."LoginSession" DROP CONSTRAINT "LoginSession_userId_fkey";

-- DropTable
DROP TABLE "public"."ApiKey";

-- DropTable
DROP TABLE "public"."LoginSession";

-- CreateTable
CREATE TABLE "DeviceDetail" (
    "id" TEXT NOT NULL,
    "encryptedIpAddress" TEXT,
    "os" TEXT,
    "platform" TEXT,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,

    CONSTRAINT "DeviceDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PersonalAccessToken" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresOn" TIMESTAMP(3),
    "deviceDetailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PersonalAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CliToken" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresOn" TIMESTAMP(3) NOT NULL,
    "deviceDetailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CliToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresOn" TIMESTAMP(3) NOT NULL,
    "deviceDetailId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAccountAccessToken" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUsedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresOn" TIMESTAMP(3),
    "lastUpdatedById" TEXT,
    "serviceAccountId" TEXT NOT NULL,

    CONSTRAINT "ServiceAccountAccessToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceServiceAccountRoleAssociation" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "serviceAccountId" TEXT NOT NULL,

    CONSTRAINT "WorkspaceServiceAccountRoleAssociation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedById" TEXT,
    "workspaceId" TEXT NOT NULL,

    CONSTRAINT "ServiceAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServiceAccountAccessHistory" (
    "id" TEXT NOT NULL,
    "lastAccessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deviceDetailId" TEXT NOT NULL,
    "serviceAccountId" TEXT NOT NULL,
    "serviceAccountAccessTokenId" TEXT,

    CONSTRAINT "ServiceAccountAccessHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceDetail_encryptedIpAddress_os_platform_idx" ON "DeviceDetail"("encryptedIpAddress", "os", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "PersonalAccessToken_hash_key" ON "PersonalAccessToken"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "CliToken_hash_key" ON "CliToken"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAccountAccessToken_hash_key" ON "ServiceAccountAccessToken"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAccountAccessToken_name_serviceAccountId_key" ON "ServiceAccountAccessToken"("name", "serviceAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceServiceAccountRoleAssociation_roleId_serviceAccoun_key" ON "WorkspaceServiceAccountRoleAssociation"("roleId", "serviceAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAccount_slug_key" ON "ServiceAccount"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceAccount_name_workspaceId_key" ON "ServiceAccount"("name", "workspaceId");

-- AddForeignKey
ALTER TABLE "PersonalAccessToken" ADD CONSTRAINT "PersonalAccessToken_deviceDetailId_fkey" FOREIGN KEY ("deviceDetailId") REFERENCES "DeviceDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PersonalAccessToken" ADD CONSTRAINT "PersonalAccessToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CliToken" ADD CONSTRAINT "CliToken_deviceDetailId_fkey" FOREIGN KEY ("deviceDetailId") REFERENCES "DeviceDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CliToken" ADD CONSTRAINT "CliToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_deviceDetailId_fkey" FOREIGN KEY ("deviceDetailId") REFERENCES "DeviceDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccountAccessToken" ADD CONSTRAINT "ServiceAccountAccessToken_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccountAccessToken" ADD CONSTRAINT "ServiceAccountAccessToken_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceServiceAccountRoleAssociation" ADD CONSTRAINT "WorkspaceServiceAccountRoleAssociation_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "WorkspaceRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceServiceAccountRoleAssociation" ADD CONSTRAINT "WorkspaceServiceAccountRoleAssociation_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccount" ADD CONSTRAINT "ServiceAccount_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccount" ADD CONSTRAINT "ServiceAccount_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccountAccessHistory" ADD CONSTRAINT "ServiceAccountAccessHistory_deviceDetailId_fkey" FOREIGN KEY ("deviceDetailId") REFERENCES "DeviceDetail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccountAccessHistory" ADD CONSTRAINT "ServiceAccountAccessHistory_serviceAccountId_fkey" FOREIGN KEY ("serviceAccountId") REFERENCES "ServiceAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServiceAccountAccessHistory" ADD CONSTRAINT "ServiceAccountAccessHistory_serviceAccountAccessTokenId_fkey" FOREIGN KEY ("serviceAccountAccessTokenId") REFERENCES "ServiceAccountAccessToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
