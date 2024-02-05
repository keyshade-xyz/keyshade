-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_lastUpdatedById_fkey";

-- DropForeignKey
ALTER TABLE "Secret" DROP CONSTRAINT "Secret_lastUpdatedById_fkey";

-- DropForeignKey
ALTER TABLE "SecretVersion" DROP CONSTRAINT "SecretVersion_createdById_fkey";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "lastUpdatedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Secret" ALTER COLUMN "lastUpdatedById" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SecretVersion" ALTER COLUMN "createdById" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretVersion" ADD CONSTRAINT "SecretVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Secret" ADD CONSTRAINT "Secret_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
