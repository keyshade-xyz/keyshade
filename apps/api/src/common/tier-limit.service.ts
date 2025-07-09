/* eslint-disable @typescript-eslint/no-unused-vars -- need to keep this until and unless we tie subscriptions */
import { PrismaService } from '@/prisma/prisma.service'
import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import {
  Environment,
  Project,
  SubscriptionPlanType,
  Workspace
} from '@prisma/client'
import { constructErrorBody } from './util'
import { SecretWithProject } from '@/secret/secret.types'
import { VariableWithProject } from '@/variable/variable.types'

const INFINITE = -1 // Used to represent infinite limit

interface TierLimit {
  MAX_PROJECTS_PER_WORKSPACE: number
  MAX_ENVIRONMENTS_PER_PROJECT: number
  MAX_SECRETS_PER_PROJECT: number
  MAX_VARIABLES_PER_PROJECT: number
  MAX_INTEGRATIONS_PER_WORKSPACE: number
  MAX_VERSIONS_PER_CONFIG_PER_ENVIRONMENT: number
  MAX_ROLES_PER_WORKSPACE: number
  AUDIT_LOG_RETENTION_DAYS: number
  MAX_SNAPSHOTS_PER_WORKSPACE: number
  IP_WHITELISTING_ALLOWED: boolean
}

interface TierLimitWithMembers extends TierLimit {
  MAX_MEMBERS_PER_WORKSPACE: number
}

const TIER_LIMITS: Record<SubscriptionPlanType, TierLimit> = {
  FREE: {
    MAX_PROJECTS_PER_WORKSPACE: 5,
    MAX_ENVIRONMENTS_PER_PROJECT: 3,
    MAX_SECRETS_PER_PROJECT: 15,
    MAX_VARIABLES_PER_PROJECT: 15,
    MAX_INTEGRATIONS_PER_WORKSPACE: 3,
    MAX_VERSIONS_PER_CONFIG_PER_ENVIRONMENT: 5,
    MAX_ROLES_PER_WORKSPACE: 5,
    AUDIT_LOG_RETENTION_DAYS: 7,
    MAX_SNAPSHOTS_PER_WORKSPACE: 0,
    IP_WHITELISTING_ALLOWED: false
  },
  HACKER: {
    MAX_PROJECTS_PER_WORKSPACE: 10,
    MAX_ENVIRONMENTS_PER_PROJECT: 5,
    MAX_SECRETS_PER_PROJECT: 30,
    MAX_VARIABLES_PER_PROJECT: 30,
    MAX_INTEGRATIONS_PER_WORKSPACE: 10,
    MAX_VERSIONS_PER_CONFIG_PER_ENVIRONMENT: 20,
    MAX_ROLES_PER_WORKSPACE: 20,
    AUDIT_LOG_RETENTION_DAYS: 15,
    MAX_SNAPSHOTS_PER_WORKSPACE: 5,
    IP_WHITELISTING_ALLOWED: false
  },
  TEAM: {
    MAX_PROJECTS_PER_WORKSPACE: 20,
    MAX_ENVIRONMENTS_PER_PROJECT: INFINITE,
    MAX_SECRETS_PER_PROJECT: 100,
    MAX_VARIABLES_PER_PROJECT: 100,
    MAX_INTEGRATIONS_PER_WORKSPACE: 30,
    MAX_VERSIONS_PER_CONFIG_PER_ENVIRONMENT: 50,
    MAX_ROLES_PER_WORKSPACE: 50,
    AUDIT_LOG_RETENTION_DAYS: 60,
    MAX_SNAPSHOTS_PER_WORKSPACE: 30,
    IP_WHITELISTING_ALLOWED: true
  },
  ENTERPRISE: {
    MAX_PROJECTS_PER_WORKSPACE: INFINITE,
    MAX_ENVIRONMENTS_PER_PROJECT: INFINITE,
    MAX_SECRETS_PER_PROJECT: INFINITE,
    MAX_VARIABLES_PER_PROJECT: INFINITE,
    MAX_INTEGRATIONS_PER_WORKSPACE: INFINITE,
    MAX_VERSIONS_PER_CONFIG_PER_ENVIRONMENT: INFINITE,
    MAX_ROLES_PER_WORKSPACE: INFINITE,
    AUDIT_LOG_RETENTION_DAYS: INFINITE,
    MAX_SNAPSHOTS_PER_WORKSPACE: INFINITE,
    IP_WHITELISTING_ALLOWED: true
  }
}

@Injectable()
export class TierLimitService {
  private readonly logger = new Logger(TierLimitService.name)

  constructor(private readonly prisma: PrismaService) {}

  async getProjectTierLimit(workspaceId: Workspace['id']) {
    const tierLimit = await this.getWorkspaceTierLimit(workspaceId)
    return tierLimit.MAX_PROJECTS_PER_WORKSPACE
  }

  async getEnvironmentTierLimit(workspaceId: Workspace['id']) {
    const tierLimit = await this.getWorkspaceTierLimit(workspaceId)
    return tierLimit.MAX_ENVIRONMENTS_PER_PROJECT
  }

  async getSecretTierLimit(workspaceId: Workspace['id']) {
    const tierLimit = await this.getWorkspaceTierLimit(workspaceId)
    return tierLimit.MAX_SECRETS_PER_PROJECT
  }

  async getVariableTierLimit(workspaceId: Workspace['id']) {
    const tierLimit = await this.getWorkspaceTierLimit(workspaceId)
    return tierLimit.MAX_VARIABLES_PER_PROJECT
  }

  async getMemberTierLimit(workspaceId: Workspace['id']) {
    const tierLimit = await this.getWorkspaceTierLimit(workspaceId)
    return tierLimit.MAX_MEMBERS_PER_WORKSPACE
  }

  async getIntegrationTierLimit(workspaceId: Workspace['id']) {
    const tierLimit = await this.getWorkspaceTierLimit(workspaceId)
    return tierLimit.MAX_INTEGRATIONS_PER_WORKSPACE
  }

  async getConfigurationVersionTierLimit(workspaceId: Workspace['id']) {
    const tierLimit = await this.getWorkspaceTierLimit(workspaceId)
    return tierLimit.MAX_VERSIONS_PER_CONFIG_PER_ENVIRONMENT
  }

  async getRoleTierLimit(workspaceId: Workspace['id']) {
    const tierLimit = await this.getWorkspaceTierLimit(workspaceId)
    return tierLimit.MAX_ROLES_PER_WORKSPACE
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

    const tierLimit = await this.getProjectTierLimit(workspace.id)
    this.logger.log(
      `Tier limit for projects in workspace ${workspace.slug} is ${tierLimit}`
    )
    if (tierLimit === INFINITE) {
      this.logger.log(
        `Workspace ${workspace.id} can have an infinite number of projects`
      )
      return
    }

    // Get all the projects in the workspace
    this.logger.log(`Counting projects of workspace ${workspace.id}`)
    const projectCount = await this.prisma.project.count({
      where: {
        workspaceId: workspace.id
      }
    })
    this.logger.log(
      `Counted ${projectCount} projects of workspace ${workspace.id}`
    )

    // Check if the workspace has reached the limit of projects
    if (projectCount >= tierLimit) {
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

    const tierLimit = await this.getEnvironmentTierLimit(project.workspaceId)
    this.logger.log(
      `Tier limit for environments in project ${project.slug} is ${tierLimit}`
    )
    if (tierLimit === INFINITE) {
      this.logger.log(
        `Project ${project.id} can have an infinite number of environments`
      )
      return
    }

    // Get all the environments in the project
    this.logger.log(`Counting environments of project ${project.id}`)
    const environmentCount = await this.prisma.environment.count({
      where: {
        projectId: project.id
      }
    })
    this.logger.log(
      `Counted ${environmentCount} environments of project ${project.id}`
    )

    // Check if the project has reached the limit of environments
    if (environmentCount >= tierLimit) {
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

    const tierLimit = await this.getSecretTierLimit(project.workspaceId)
    this.logger.log(
      `Tier limit for secrets in project ${project.slug} is ${tierLimit}`
    )
    if (tierLimit === INFINITE) {
      this.logger.log(
        `Project ${project.id} can have an infinite number of secrets`
      )
      return
    }

    // Get all the secrets in the project
    this.logger.log(`Counting secrets of project ${project.id}`)
    const secretCount = await this.prisma.secret.count({
      where: {
        projectId: project.id
      }
    })
    this.logger.log(`Counted ${secretCount} secrets of project ${project.id}`)

    // Check if the project has reached the limit of secrets
    if (secretCount >= tierLimit) {
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

    const tierLimit = await this.getVariableTierLimit(project.workspaceId)
    this.logger.log(
      `Tier limit for variables in project ${project.slug} is ${tierLimit}`
    )
    if (tierLimit === INFINITE) {
      this.logger.log(
        `Project ${project.id} can have an infinite number of variables`
      )
      return
    }

    // Count all the variables in the project
    this.logger.log(`Counting variables of project ${project.id}`)
    const variableCount = await this.prisma.variable.count({
      where: {
        projectId: project.id
      }
    })
    this.logger.log(
      `Counted ${variableCount} variables of project ${project.id}`
    )

    // Check if the project has reached the limit of variables
    if (variableCount >= tierLimit) {
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

    const tierLimit = await this.getMemberTierLimit(workspace.id)
    this.logger.log(
      `Tier limit for members in workspace ${workspace.slug} is ${tierLimit}`
    )
    if (tierLimit === INFINITE) {
      this.logger.log(
        `Workspace ${workspace.id} can have an infinite number of members`
      )
      return
    }

    // Get all the members in the workspace
    this.logger.log(`Fetching members of workspace ${workspace.id}`)
    const memberCount = await this.prisma.workspaceMember.count({
      where: {
        workspaceId: workspace.id
      }
    })
    this.logger.log(
      `Fetched ${memberCount} members of workspace ${workspace.id}`
    )

    // Check if the workspace has reached the limit of members
    if (memberCount >= tierLimit) {
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

  async checkIntegrationLimitReached(workspace: Workspace) {
    this.logger.log(
      `Checking if workspace ${workspace.id} has reached the limit of integrations`
    )

    const tierLimit = await this.getIntegrationTierLimit(workspace.id)
    this.logger.log(
      `Tier limit for integrations in workspace ${workspace.slug} is ${tierLimit}`
    )
    if (tierLimit === INFINITE) {
      this.logger.log(
        `Workspace ${workspace.id} can have an infinite number of integrations`
      )
      return
    }

    // Get the count of integrations in the workspace
    this.logger.log(`Fetching integrations of workspace ${workspace.id}`)
    const integrationCount = await this.prisma.integration.count({
      where: {
        workspaceId: workspace.id
      }
    })
    this.logger.log(
      `Fetched ${integrationCount} integrations of workspace ${workspace.id}`
    )

    // Check if the workspace has reached the limit of integrations
    if (integrationCount >= tierLimit) {
      this.logger.error(
        `Workspace ${workspace.id} has reached the limit of maximum integrations`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of integrations reached',
          `You can create a maximum of ${tierLimit} integrations`
        )
      )
    } else {
      this.logger.log(
        `Workspace ${workspace.id} has not reached the limit of integrations`
      )
    }
  }

  async checkConfigurationVersionLimitReached(
    configuration: SecretWithProject | VariableWithProject,
    environmentId: Environment['id'],
    type: 'secret' | 'variable'
  ) {
    const configurationId = configuration.id
    const workspaceId = configuration.project.workspaceId

    this.logger.log(
      `Checking if ${type} ${configurationId} has reached the limit of configuration versions`
    )

    const tierLimit = await this.getConfigurationVersionTierLimit(workspaceId)
    this.logger.log(
      `Tier limit for configuration versions in workspace ${workspaceId} is ${tierLimit}`
    )
    if (tierLimit === INFINITE) {
      this.logger.log(
        `${type} ${configurationId} can have an infinite number of revisions`
      )
      return
    }

    // Get the count of revisions in the configuration
    this.logger.log(
      `Fetching revision count of ${type} ${configurationId} in environment ${environmentId}`
    )
    let count: number
    if (type === 'secret') {
      count = await this.prisma.secretVersion.count({
        where: {
          secretId: configurationId,
          environmentId
        }
      })
    } else {
      count = await this.prisma.variableVersion.count({
        where: {
          variableId: configurationId,
          environmentId
        }
      })
    }

    this.logger.log(
      `Fetched ${count} revisions of ${type} ${configurationId} in environment ${environmentId}`
    )

    // Check if the configuration has reached the limit of revisions
    if (count < tierLimit) {
      this.logger.log(
        `${type} ${configurationId} has not reached the limit of configuration versions in environment ${environmentId}`
      )
      return
    }

    // If yes, delete the last revision
    this.logger.error(
      `${type} ${configurationId} has reached the limit of maximum configuration versions in environment ${environmentId}. Deleting the last revision...`
    )
    if (type === 'secret') {
      const lastRevision = await this.prisma.secretVersion.findFirst({
        where: {
          secretId: configurationId,
          environmentId
        },
        orderBy: {
          version: 'desc'
        },
        take: 1
      })

      if (lastRevision) {
        this.logger.log(`Deleting last revision of secret ${configurationId}`)
        await this.prisma.secretVersion.delete({
          where: {
            id: lastRevision.id
          }
        })
        this.logger.log(
          `Deleted last revision of secret ${configurationId} in environment ${environmentId}`
        )
      }
    } else {
      const lastRevision = await this.prisma.variableVersion.findFirst({
        where: {
          variableId: configurationId,
          environmentId
        },
        orderBy: {
          version: 'desc'
        },
        take: 1
      })

      if (lastRevision) {
        this.logger.log(`Deleting last revision of variable ${configurationId}`)
        await this.prisma.variableVersion.delete({
          where: {
            id: lastRevision.id
          }
        })
        this.logger.log(
          `Deleted last revision of variable ${configurationId} in environment ${environmentId}`
        )
      }
    }
  }

  async checkRoleLimitReached(workspace: Workspace) {
    this.logger.log(
      `Checking if workspace ${workspace.id} has reached the limit of roles`
    )

    const tierLimit = await this.getRoleTierLimit(workspace.id)
    this.logger.log(
      `Tier limit for roles in workspace ${workspace.slug} is ${tierLimit}`
    )
    if (tierLimit === INFINITE) {
      this.logger.log(
        `Workspace ${workspace.id} can have an infinite number of roles`
      )
      return
    }

    // Get the count of roles in the workspace
    this.logger.log(`Fetching roles of workspace ${workspace.id}`)
    const roleCount = await this.prisma.workspaceRole.count({
      where: {
        workspaceId: workspace.id
      }
    })
    this.logger.log(`Fetched ${roleCount} roles of workspace ${workspace.id}`)

    // Check if the workspace has reached the limit of roles
    if (roleCount >= tierLimit) {
      this.logger.error(
        `Workspace ${workspace.id} has reached the limit of maximum roles`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of roles reached',
          `You can create a maximum of ${tierLimit} roles`
        )
      )
    } else {
      this.logger.log(
        `Workspace ${workspace.id} has not reached the limit of roles`
      )
    }
  }

  /**
   * Retrieves the tier limits for a given workspace based on its subscription plan.
   * It checks if a trial period is activated and determines the appropriate
   * subscription plan to use for tier limits. The maximum number of members allowed
   * is determined by the seats booked in the subscription.
   *
   * @param workspaceId The ID of the workspace to retrieve tier limits for.
   * @returns A promise that resolves to an object containing the tier limits
   * with the maximum members allowed for the workspace.
   */
  private async getWorkspaceTierLimit(
    workspaceId: Workspace['id']
  ): Promise<TierLimitWithMembers> {
    this.logger.log(`Finding subscription for workspace ${workspaceId}`)
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        workspaceId
      }
    })
    this.logger.log(
      `Found subscription ${subscription.id} for workspace ${workspaceId}`
    )

    this.logger.log(
      `Checking if trial has been activated for workspace ${workspaceId}`
    )

    const subscriptionPlan = subscription.plan
    this.logger.log(
      `Subscription plan for workspace ${workspaceId} is ${subscriptionPlan}`
    )

    return {
      ...TIER_LIMITS[subscriptionPlan],
      MAX_MEMBERS_PER_WORKSPACE: subscription.seatsBooked
    }
  }
}
