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
import { HydratedSecret } from '@/secret/secret.types'
import { HydratedVariable } from '@/variable/variable.types'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'

const INFINITE = -1 // Used to represent infinite limit

interface TierLimit {
  MAX_PROJECTS_PER_WORKSPACE: number
  MAX_ENVIRONMENTS_PER_PROJECT: number
  MAX_SECRETS_PER_PROJECT: number
  MAX_VARIABLES_PER_PROJECT: number
  MAX_INTEGRATIONS_PER_WORKSPACE: number
  MAX_REVISIONS_PER_CONFIG_PER_ENVIRONMENT: number
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
    MAX_REVISIONS_PER_CONFIG_PER_ENVIRONMENT: 5,
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
    MAX_REVISIONS_PER_CONFIG_PER_ENVIRONMENT: 20,
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
    MAX_REVISIONS_PER_CONFIG_PER_ENVIRONMENT: 50,
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
    MAX_REVISIONS_PER_CONFIG_PER_ENVIRONMENT: INFINITE,
    MAX_ROLES_PER_WORKSPACE: INFINITE,
    AUDIT_LOG_RETENTION_DAYS: INFINITE,
    MAX_SNAPSHOTS_PER_WORKSPACE: INFINITE,
    IP_WHITELISTING_ALLOWED: true
  }
}

@Injectable()
export class TierLimitService {
  private readonly logger = new Logger(TierLimitService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly workspaceCacheService: WorkspaceCacheService
  ) {}

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

    const projectTierLimit = (await this.getWorkspaceTierLimit(workspace.id))
      .MAX_PROJECTS_PER_WORKSPACE

    this.logger.log(
      `Tier limit for projects in workspace ${workspace.slug} is ${projectTierLimit}`
    )
    if (projectTierLimit === INFINITE) {
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
    if (projectCount >= projectTierLimit) {
      this.logger.error(
        `Workspace ${workspace.id} has reached the limit of maximum projects`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of projects reached',
          `You can create a maximum of ${projectTierLimit} projects`
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

    const environmentTierLimit = (
      await this.getWorkspaceTierLimit(project.workspaceId)
    ).MAX_ENVIRONMENTS_PER_PROJECT

    this.logger.log(
      `Tier limit for environments in project ${project.slug} is ${environmentTierLimit}`
    )
    if (environmentTierLimit === INFINITE) {
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
    if (environmentCount >= environmentTierLimit) {
      this.logger.error(
        `Project ${project.id} has reached the limit of maximum environments`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of environments reached',
          `You can create a maximum of ${environmentTierLimit} environments`
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

    const secretTierLimit = (
      await this.getWorkspaceTierLimit(project.workspaceId)
    ).MAX_SECRETS_PER_PROJECT

    this.logger.log(
      `Tier limit for secrets in project ${project.slug} is ${secretTierLimit}`
    )
    if (secretTierLimit === INFINITE) {
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
    if (secretCount >= secretTierLimit) {
      this.logger.error(
        `Project ${project.id} has reached the limit of maximum secrets`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of secrets reached',
          `You can create a maximum of ${secretTierLimit} secrets`
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

    const variableTierLimit = (
      await this.getWorkspaceTierLimit(project.workspaceId)
    ).MAX_VARIABLES_PER_PROJECT

    this.logger.log(
      `Tier limit for variables in project ${project.slug} is ${variableTierLimit}`
    )
    if (variableTierLimit === INFINITE) {
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
    if (variableCount >= variableTierLimit) {
      this.logger.error(
        `Project ${project.id} has reached the limit of maximum variables`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of variables reached',
          `You can create a maximum of ${variableTierLimit} variables`
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

    const memberTierLimit = (await this.getWorkspaceTierLimit(workspace.id))
      .MAX_MEMBERS_PER_WORKSPACE

    this.logger.log(
      `Tier limit for members in workspace ${workspace.slug} is ${memberTierLimit}`
    )
    if (memberTierLimit === INFINITE) {
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
    if (memberCount >= memberTierLimit) {
      this.logger.error(
        `Workspace ${workspace.id} has reached the limit of maximum members`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of members reached',
          `You can create a maximum of ${memberTierLimit} members`
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

    const integrationTierLimit = (
      await this.getWorkspaceTierLimit(workspace.id)
    ).MAX_INTEGRATIONS_PER_WORKSPACE

    this.logger.log(
      `Tier limit for integrations in workspace ${workspace.slug} is ${integrationTierLimit}`
    )
    if (integrationTierLimit === INFINITE) {
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
    if (integrationCount >= integrationTierLimit) {
      this.logger.error(
        `Workspace ${workspace.id} has reached the limit of maximum integrations`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of integrations reached',
          `You can create a maximum of ${integrationTierLimit} integrations`
        )
      )
    } else {
      this.logger.log(
        `Workspace ${workspace.id} has not reached the limit of integrations`
      )
    }
  }

  async checkConfigurationVersionLimitReached(
    configuration: HydratedSecret | HydratedVariable,
    environmentId: Environment['id'],
    type: 'secret' | 'variable'
  ) {
    const configurationId = configuration.id
    const workspaceId = configuration.project.workspaceId

    this.logger.log(
      `Checking if ${type} ${configurationId} has reached the limit of configuration versions`
    )

    const configVersionTierLimit = (
      await this.getWorkspaceTierLimit(workspaceId)
    ).MAX_REVISIONS_PER_CONFIG_PER_ENVIRONMENT

    this.logger.log(
      `Tier limit for configuration versions in workspace ${workspaceId} is ${configVersionTierLimit}`
    )
    if (configVersionTierLimit === INFINITE) {
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
    if (count < configVersionTierLimit) {
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

    const roleTierLimit = (await this.getWorkspaceTierLimit(workspace.id))
      .MAX_ROLES_PER_WORKSPACE

    this.logger.log(
      `Tier limit for roles in workspace ${workspace.slug} is ${roleTierLimit}`
    )
    if (roleTierLimit === INFINITE) {
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
    if (roleCount >= roleTierLimit) {
      this.logger.error(
        `Workspace ${workspace.id} has reached the limit of maximum roles`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Maximum limit of roles reached',
          `You can create a maximum of ${roleTierLimit} roles`
        )
      )
    } else {
      this.logger.log(
        `Workspace ${workspace.id} has not reached the limit of roles`
      )
    }
  }

  /**
   * Retrieves the tier limit for a given workspace, including the maximum number of members
   * @param workspaceId the ID of the workspace
   * @returns the tier limit for the workspace, including the maximum number of members
   */
  public async getWorkspaceTierLimit(
    workspaceId: Workspace['id']
  ): Promise<TierLimitWithMembers> {
    const subscription =
      await this.workspaceCacheService.getWorkspaceSubscription(workspaceId)

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
