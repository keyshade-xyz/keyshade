import { Project, WorkspaceRole } from '@prisma/client'

export interface WorkspaceRoleWithProjects extends WorkspaceRole {
  projects: {
    projectId: Project['id']
  }[]
}
