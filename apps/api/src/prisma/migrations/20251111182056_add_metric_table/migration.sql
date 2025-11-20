-- CreateTable
CREATE TABLE "Metric" (
    "id" TEXT NOT NULL,
    "totalSecretPulls" INTEGER NOT NULL DEFAULT 0,
    "totalVariablePulls" INTEGER NOT NULL DEFAULT 0,
    "totalRunCommandExecutions" INTEGER NOT NULL DEFAULT 0,
    "date" TEXT NOT NULL,

    CONSTRAINT "Metric_pkey" PRIMARY KEY ("id")
);
