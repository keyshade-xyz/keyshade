import { Project, WorkspaceRole } from '@prisma/client'

export interface WorkspaceRoleWithProjects extends WorkspaceRole {
  projects: {
    project: {
      id: Project['id']
      name: Project['name']
      slug: Project['slug']
    }
  }[]
}
