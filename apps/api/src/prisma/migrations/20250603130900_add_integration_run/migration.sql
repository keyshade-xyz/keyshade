-- CreateEnum
CREATE TYPE "IntegrationRunStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "IntegrationRun" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL,
    "logs" TEXT,
    "status" "IntegrationRunStatus" NOT NULL,
    "eventId" TEXT NOT NULL,
    "integrationId" TEXT NOT NULL,

    CONSTRAINT "IntegrationRun_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "IntegrationRun" ADD CONSTRAINT "IntegrationRun_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntegrationRun" ADD CONSTRAINT "IntegrationRun_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "Integration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
