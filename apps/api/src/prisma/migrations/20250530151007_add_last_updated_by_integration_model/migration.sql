-- AlterTable
ALTER TABLE "Integration" ADD COLUMN     "lastUpdatedById" TEXT;

-- AddForeignKey
ALTER TABLE "Integration" ADD CONSTRAINT "Integration_lastUpdatedById_fkey" FOREIGN KEY ("lastUpdatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
