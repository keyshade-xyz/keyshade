/*
  Warnings:

  - The values [PENDING] on the enum `IntegrationRunStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "IntegrationRunStatus_new" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');
ALTER TABLE "IntegrationRun" ALTER COLUMN "status" TYPE "IntegrationRunStatus_new" USING ("status"::text::"IntegrationRunStatus_new");
ALTER TYPE "IntegrationRunStatus" RENAME TO "IntegrationRunStatus_old";
ALTER TYPE "IntegrationRunStatus_new" RENAME TO "IntegrationRunStatus";
DROP TYPE "IntegrationRunStatus_old";
COMMIT;
