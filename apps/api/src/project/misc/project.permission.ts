import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import { Project, ProjectRole, User } from '@prisma/client'
import { ProjectRepository } from '../repository/project.repository'
import { PROJECT_REPOSITORY } from '../repository/interface.repository'

@Injectable()
export class ProjectPermission {
  constructor(
    @Inject(PROJECT_REPOSITORY) private readonly repository: ProjectRepository
  ) {}

  async isProjectAdmin(user: User, projectId: Project['id']): Promise<void> {
    // Admins can do everything
    if (user.isAdmin) Promise.resolve()

    // Else, check if the user is a project admin
    const memberships = await this.resolveProjectsOfUser(user)
    const membership = memberships.find(
      (membership) => membership.projectId === projectId
    )
    if (!membership) {
      throw new UnauthorizedException('User is not a member of the project')
    }
    if (membership.role !== ProjectRole.OWNER) {
      throw new UnauthorizedException('Atleast OWNER role is required')
    }
  }

  async isProjectMaintainer(
    user: User,
    projectId: Project['id']
  ): Promise<void> {
    // Admins can do everything
    if (user.isAdmin) Promise.resolve()

    // Else, check if the user is a project admin
    const memberships = await this.resolveProjectsOfUser(user)
    const membership = memberships.find(
      (membership) => membership.projectId === projectId
    )
    if (!membership) {
      throw new UnauthorizedException('User is not a member of the project')
    }
    if (
      membership.role !== ProjectRole.OWNER &&
      membership.role !== ProjectRole.MAINTAINER
    ) {
      throw new UnauthorizedException('Atleast MAINTAINER role is required')
    }
  }

  async isProjectMember(user: User, projectId: Project['id']): Promise<void> {
    // Admins can do everything
    if (user.isAdmin) Promise.resolve()

    // Else, check if the user is a project admin
    const memberships = await this.resolveProjectsOfUser(user)
    const membership = memberships.find(
      (membership) => membership.projectId === projectId
    )
    if (!membership) {
      throw new UnauthorizedException('User is not a member of the project')
    }
  }

  private async resolveProjectsOfUser(
    user: User
  ): Promise<{ projectId: Project['id']; role: ProjectRole }[]> {
    const memberships = await this.repository.getProjectMembershipsOfUser(
      user.id
    )
    return memberships.map((membership) => ({
      projectId: membership.projectId,
      role: membership.role
    }))
  }
}
