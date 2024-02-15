/*
  Warnings:

  - The values [TRANSFER_OWNERSHIP] on the enum `Authority` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Authority_new" AS ENUM ('CREATE_PROJECT', 'READ_USERS', 'ADD_USER', 'REMOVE_USER', 'UPDATE_USER_ROLE', 'READ_WORKSPACE', 'UPDATE_WORKSPACE', 'DELETE_WORKSPACE', 'CREATE_WORKSPACE_ROLE', 'READ_WORKSPACE_ROLE', 'UPDATE_WORKSPACE_ROLE', 'DELETE_WORKSPACE_ROLE', 'WORKSPACE_ADMIN', 'READ_PROJECT', 'UPDATE_PROJECT', 'DELETE_PROJECT', 'CREATE_SECRET', 'READ_SECRET', 'UPDATE_SECRET', 'DELETE_SECRET', 'CREATE_ENVIRONMENT', 'READ_ENVIRONMENT', 'UPDATE_ENVIRONMENT', 'DELETE_ENVIRONMENT', 'CREATE_WORKSPACE', 'CREATE_API_KEY', 'READ_API_KEY', 'UPDATE_API_KEY', 'DELETE_API_KEY', 'UPDATE_PROFILE', 'READ_SELF', 'UPDATE_SELF', 'READ_EVENT');
ALTER TABLE "WorkspaceRole" ALTER COLUMN "authorities" TYPE "Authority_new"[] USING ("authorities"::text::"Authority_new"[]);
ALTER TABLE "ApiKey" ALTER COLUMN "authorities" TYPE "Authority_new"[] USING ("authorities"::text::"Authority_new"[]);
ALTER TYPE "Authority" RENAME TO "Authority_old";
ALTER TYPE "Authority_new" RENAME TO "Authority";
DROP TYPE "Authority_old";
COMMIT;
