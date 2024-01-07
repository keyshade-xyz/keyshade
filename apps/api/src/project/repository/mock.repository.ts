/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  $Enums,
  Project,
  ProjectMember,
  ProjectRole,
  User
} from '@prisma/client'
import { IProjectRepository } from './interface.repository'
import {
  ProjectWithMembersAndSecrets,
  ProjectWithSecrets
} from '../project.types'

export class MockProjectRepository implements IProjectRepository {
  getProjectByUserIdAndId(
    userId: string,
    projectId: string
  ): Promise<ProjectWithMembersAndSecrets> {
    throw new Error('Method not implemented.')
  }
  getProjectById(projectId: string): Promise<ProjectWithSecrets> {
    throw new Error('Method not implemented.')
  }
  deleteMembership(projectId: string, userId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  invitationPending(projectId: string, userId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  addMemberToProject(
    projectId: string,
    userId: string,
    role: $Enums.ProjectRole
  ): Promise<{
    id: string
    role: $Enums.ProjectRole
    userId: string
    projectId: string
    invitationAccepted: boolean
  }> {
    throw new Error('Method not implemented.')
  }
  removeMemberFromProject(projectId: string, userId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }
  updateMembership(
    projectId: string,
    userId: string,
    data: Partial<Pick<ProjectMember, 'role' | 'invitationAccepted'>>
  ): Promise<{
    id: string
    role: $Enums.ProjectRole
    userId: string
    projectId: string
    invitationAccepted: boolean
  }> {
    throw new Error('Method not implemented.')
  }
  memberExistsInProject(projectId: string, userId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  getMembersOfProject(
    projectId: string,
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<
    {
      id: string
      role: $Enums.ProjectRole
      user: {
        id: string
        email: string
        name: string
        profilePictureUrl: string
        isActive: boolean
        isOnboardingFinished: boolean
        isAdmin: boolean
      }
      invitationAccepted: boolean
    }[]
  > {
    throw new Error('Method not implemented.')
  }
  projectExists(projectName: string, userId: string): Promise<boolean> {
    throw new Error('Method not implemented.')
  }

  createProject(project: Partial<Project>, userId: string): Promise<Project> {
    throw new Error('Method not implemented.')
  }

  updateProject(
    projectId: string,
    project: Partial<Project>,
    userId: string
  ): Promise<Project> {
    throw new Error('Method not implemented.')
  }

  deleteProject(projectId: string): Promise<void> {
    throw new Error('Method not implemented.')
  }

  getProjectsOfUser(
    userId: User['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Array<Project & { role: ProjectRole }>> {
    throw new Error('Method not implemented.')
  }

  getProjects(
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ): Promise<Project[]> {
    throw new Error('Method not implemented.')
  }

  getProjectMembershipsOfUser(userId: User['id']): Promise<ProjectMember[]> {
    throw new Error('Method not implemented.')
  }
}
