/* eslint-disable @typescript-eslint/no-unused-vars -- need to keep this until and unless we tie subscriptions */
import { PrismaService } from '@/prisma/prisma.service'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import { Project, Workspace } from '@prisma/client'
import { constructErrorBody } from './util'

const FreeTierLimit = {
  MAX_PROJECTS_PER_WORKSPACE: 10,
  MAX_ENVIRONMENTS_PER_PROJECT: 5,
  MAX_SECRETS_PER_PROJECT: 50,
  MAX_VARIABLES_PER_PROJECT: 50,
  MAX_MEMBERS_PER_WORKSPACE: 5
}

@Injectable()
export class TierLimitService {
  private readonly logger = new Logger(TierLimitService.name)

  constructor(private readonly prisma: PrismaService) {}

  getProjectTierLimit(workspace: Workspace) {
    return FreeTierLimit.MAX_PROJECTS_PER_WORKSPACE
  }

  getEnvironmentTierLimit(project: Project) {
    return FreeTierLimit.MAX_ENVIRONMENTS_PER_PROJECT
  }

  getSecretTierLimit(project: Project) {
    return FreeTierLimit.MAX_SECRETS_PER_PROJECT
  }

  getVariableTierLimit(project: Project) {
    return FreeTierLimit.MAX_VARIABLES_PER_PROJECT
  }

  getMemberTierLimit(workspace: Workspace) {
    return FreeTierLimit.MAX_MEMBERS_PER_WORKSPACE
  }

  /**
   * Check if the workspace has reached the limit of projects. If the limit is
   * reached, throw a BadRequestException.
   *
   * @param workspace The workspace to check.
   * @throws BadRequestException if the limit is reached.
   */
  async checkProjectLimitReached(workspace: Workspace) {
    this.logger.log(
      `Checking if workspace ${workspace.id} has reached the limit of projects`
    )

    // Get all the projects in the workspace
    this.logger.log(`Fetching projects of workspace ${workspace.id}`)
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId: workspace.id
      }
    })
    this.logger.log(
      `Fetched ${projects.length} projects of workspace ${workspace.id}`
    )

    const tierLimit = this.getProjectTierLimit(workspace)
    this.logger.log(
      `Tier limit for projects in workspace ${workspace.slug} is ${tierLimit}`
    )

    // Check if the workspace has reached the limit of projects
    if (projects.length >= tierLimit) {
      this.logger.error(
        `Workspace ${workspace.id} has reached the limit of maximum projects`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of projects reached',
          `You can create a maximum of ${tierLimit} projects`
        )
      )
    } else {
      this.logger.log(
        `Workspace ${workspace.id} has not reached the limit of projects`
      )
    }
  }

  /**
   * Check if the project has reached the limit of environments. If the limit is
   * reached, throw a BadRequestException.
   *
   * @param project The project to check.
   * @throws BadRequestException if the limit is reached.
   */
  async checkEnvironmentLimitReached(project: Project) {
    this.logger.log(
      `Checking if project ${project.id} has reached the limit of environments`
    )

    // Get all the environments in the project
    this.logger.log(`Fetching environments of project ${project.id}`)
    const environments = await this.prisma.environment.findMany({
      where: {
        projectId: project.id
      }
    })
    this.logger.log(
      `Fetched ${environments.length} environments of project ${project.id}`
    )

    const tierLimit = this.getEnvironmentTierLimit(project)
    this.logger.log(
      `Tier limit for environments in project ${project.slug} is ${tierLimit}`
    )

    // Check if the project has reached the limit of environments
    if (environments.length >= tierLimit) {
      this.logger.error(
        `Project ${project.id} has reached the limit of maximum environments`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of environments reached',
          `You can create a maximum of ${tierLimit} environments`
        )
      )
    } else {
      this.logger.log(
        `Project ${project.id} has not reached the limit of environments`
      )
    }
  }

  /**
   * Check if the project has reached the limit of secrets. If the limit is
   * reached, throw a BadRequestException.
   *
   * @param project The project to check.
   * @throws BadRequestException if the limit is reached.
   */
  async checkSecretLimitReached(project: Project) {
    this.logger.log(
      `Checking if project ${project.id} has reached the limit of secrets`
    )

    // Get all the secrets in the project
    this.logger.log(`Fetching secrets of project ${project.id}`)
    const secrets = await this.prisma.secret.findMany({
      where: {
        projectId: project.id
      }
    })
    this.logger.log(
      `Fetched ${secrets.length} secrets of project ${project.id}`
    )

    const tierLimit = this.getSecretTierLimit(project)
    this.logger.log(
      `Tier limit for secrets in project ${project.slug} is ${tierLimit}`
    )

    // Check if the project has reached the limit of secrets
    if (secrets.length >= tierLimit) {
      this.logger.error(
        `Project ${project.id} has reached the limit of maximum secrets`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of secrets reached',
          `You can create a maximum of ${tierLimit} secrets`
        )
      )
    } else {
      this.logger.log(
        `Project ${project.id} has not reached the limit of secrets`
      )
    }
  }

  /**
   * Check if the project has reached the limit of variables. If the limit is
   * reached, throw a BadRequestException.
   *
   * @param project The project to check.
   * @throws BadRequestException if the limit is reached.
   */
  async checkVariableLimitReached(project: Project) {
    this.logger.log(
      `Checking if project ${project.id} has reached the limit of variables`
    )

    // Get all the variables in the project
    this.logger.log(`Fetching variables of project ${project.id}`)
    const variables = await this.prisma.variable.findMany({
      where: {
        projectId: project.id
      }
    })
    this.logger.log(
      `Fetched ${variables.length} variables of project ${project.id}`
    )

    const tierLimit = this.getVariableTierLimit(project)
    this.logger.log(
      `Tier limit for variables in project ${project.slug} is ${tierLimit}`
    )

    // Check if the project has reached the limit of variables
    if (variables.length >= tierLimit) {
      this.logger.error(
        `Project ${project.id} has reached the limit of maximum variables`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of variables reached',
          `You can create a maximum of ${tierLimit} variables`
        )
      )
    } else {
      this.logger.log(
        `Project ${project.id} has not reached the limit of variables`
      )
    }
  }

  /**
   * Check if the workspace has reached the limit of members. If the limit is
   * reached, throw a BadRequestException.
   *
   * @param workspace The workspace to check.
   * @throws BadRequestException if the limit is reached.
   */
  async checkMemberLimitReached(workspace: Workspace) {
    this.logger.log(
      `Checking if workspace ${workspace.id} has reached the limit of members`
    )

    // Get all the members in the workspace
    this.logger.log(`Fetching members of workspace ${workspace.id}`)
    const members = await this.prisma.workspaceMember.findMany({
      where: {
        workspaceId: workspace.id
      }
    })
    this.logger.log(
      `Fetched ${members.length} members of workspace ${workspace.id}`
    )

    const tierLimit = this.getMemberTierLimit(workspace)
    this.logger.log(
      `Tier limit for members in workspace ${workspace.slug} is ${tierLimit}`
    )

    // Check if the workspace has reached the limit of members
    if (members.length >= tierLimit) {
      this.logger.error(
        `Workspace ${workspace.id} has reached the limit of maximum members`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of members reached',
          `You can create a maximum of ${tierLimit} members`
        )
      )
    } else {
      this.logger.log(
        `Workspace ${workspace.id} has not reached the limit of members`
      )
    }
  }
}
