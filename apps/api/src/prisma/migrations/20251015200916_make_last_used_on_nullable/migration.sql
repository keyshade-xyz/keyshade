-- AlterTable
ALTER TABLE "BrowserSession" ALTER COLUMN "lastUsedOn" DROP NOT NULL,
ALTER COLUMN "lastUsedOn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "CliSession" ALTER COLUMN "lastUsedOn" DROP NOT NULL,
ALTER COLUMN "lastUsedOn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PersonalAccessToken" ALTER COLUMN "lastUsedOn" DROP NOT NULL,
ALTER COLUMN "lastUsedOn" DROP DEFAULT;

-- AlterTable
ALTER TABLE "ServiceAccountAccessToken" ALTER COLUMN "lastUsedOn" DROP NOT NULL,
ALTER COLUMN "lastUsedOn" DROP DEFAULT;
