-- CreateEnum
CREATE TYPE "EventSource" AS ENUM ('SECRET', 'API_KEY', 'ENVIRONMENT', 'PROJECT', 'WORKSPACE', 'WORKSPACE_ROLE', 'USER', 'WORKSPACE_MEMBER');

-- CreateEnum
CREATE TYPE "EventTriggerer" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "EventSeverity" AS ENUM ('INFO', 'WARN', 'ERROR');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('INVITED_TO_WORKSPACE', 'REMOVED_FROM_WORKSPACE', 'ACCEPTED_INVITATION', 'DECLINED_INVITATION', 'CANCELLED_INVITATION', 'LEFT_WORKSPACE', 'WORKSPACE_MEMBERSHIP_UPDATED', 'WORKSPACE_UPDATED', 'WORKSPACE_DELETED', 'WORKSPACE_CREATED', 'WORKSPACE_ROLE_CREATED', 'WORKSPACE_ROLE_UPDATED', 'WORKSPACE_ROLE_DELETED', 'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED', 'SECRET_UPDATED', 'SECRET_DELETED', 'SECRET_ADDED', 'API_KEY_UPDATED', 'API_KEY_DELETED', 'API_KEY_ADDED', 'ENVIRONMENT_UPDATED', 'ENVIRONMENT_DELETED', 'ENVIRONMENT_ADDED', 'USER_UPDATED');

-- AlterEnum
ALTER TYPE "Authority" ADD VALUE 'READ_EVENT';

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "source" "EventSource" NOT NULL,
    "triggerer" "EventTriggerer" NOT NULL,
    "severity" "EventSeverity" NOT NULL,
    "type" "EventType" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sourceUserId" TEXT,
    "sourceWorkspaceId" TEXT,
    "sourceWorkspaceRoleId" TEXT,
    "sourceProjectId" TEXT,
    "sourceEnvironmentId" TEXT,
    "sourceSecretId" TEXT,
    "sourceApiKeyId" TEXT,
    "sourceWorkspaceMembershipId" TEXT,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceUserId_fkey" FOREIGN KEY ("sourceUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceWorkspaceId_fkey" FOREIGN KEY ("sourceWorkspaceId") REFERENCES "Workspace"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceWorkspaceRoleId_fkey" FOREIGN KEY ("sourceWorkspaceRoleId") REFERENCES "WorkspaceRole"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceProjectId_fkey" FOREIGN KEY ("sourceProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceEnvironmentId_fkey" FOREIGN KEY ("sourceEnvironmentId") REFERENCES "Environment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceSecretId_fkey" FOREIGN KEY ("sourceSecretId") REFERENCES "Secret"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceApiKeyId_fkey" FOREIGN KEY ("sourceApiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_sourceWorkspaceMembershipId_fkey" FOREIGN KEY ("sourceWorkspaceMembershipId") REFERENCES "WorkspaceMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
