/*
  Warnings:

  - The values [WORKSPACE_MEMBER] on the enum `EventSource` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventSource_new" AS ENUM ('SECRET', 'API_KEY', 'ENVIRONMENT', 'PROJECT', 'WORKSPACE', 'WORKSPACE_ROLE', 'USER');
ALTER TABLE "Event" ALTER COLUMN "source" TYPE "EventSource_new" USING ("source"::text::"EventSource_new");
ALTER TYPE "EventSource" RENAME TO "EventSource_old";
ALTER TYPE "EventSource_new" RENAME TO "EventSource";
DROP TYPE "EventSource_old";
COMMIT;
