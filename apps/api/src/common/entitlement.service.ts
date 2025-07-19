import {
  HydratedIntegration,
  RawIntegration
} from '@/integration/integration.types'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthenticatedUser } from '@/user/user.types'
import { Injectable, Logger } from '@nestjs/common'
import {
  Authority,
  Environment,
  Project,
  ProjectAccessLevel,
  Workspace
} from '@prisma/client'
import {
  getCollectiveEnvironmentAuthorities,
  getCollectiveProjectAuthorities,
  getCollectiveWorkspaceAuthorities
} from './collective-authorities'
import { RawEntitledSecret, RawSecret } from '@/secret/secret.types'
import { RawEntitledVariable, RawVariable } from '@/variable/variable.types'
import {
  HydratedEnvironment,
  RawEnvironment
} from '@/environment/environment.types'
import {
  HydratedWorkspaceRole,
  RawWorkspaceRole
} from '@/workspace-role/workspace-role.types'
import {
  HydratedWorkspaceMember,
  RawWorkspaceMember
} from '@/workspace-membership/workspace-membership.types'
import { HydratedProject, RawProject } from '@/project/project.types'
import { TierLimitService } from './tier-limit.service'
import { AuthorizationService } from '@/auth/service/authorization.service'

type RootEntitlementParams = {
  user: AuthenticatedUser
  permittedAuthorities?: Set<Authority>
}

type IntegrationEntitlementParams = RootEntitlementParams & {
  workspaceId: Workspace['id']
  integration: RawIntegration
}

type SecretEntitlementParams = RootEntitlementParams & {
  project: Partial<Project>
  secret: RawSecret
}

type VariableEntitlementParams = RootEntitlementParams & {
  project: Partial<Project>
  variable: RawVariable
}

type EnvironmentEntitlementParams = RootEntitlementParams & {
  environment: RawEnvironment
}

type WorkspaceRoleEntitlementParams = RootEntitlementParams & {
  workspaceRole: RawWorkspaceRole
}

type WorkspaceMemberEntitlementParams = RootEntitlementParams & {
  workspaceMember: RawWorkspaceMember
}

type ProjectEntitlementParams = RootEntitlementParams & {
  project: RawProject
  tierLimitService: TierLimitService
  authorizationService: AuthorizationService
}

@Injectable()
export class EntitlementService {
  private readonly logger = new Logger(EntitlementService.name)

  constructor(private readonly prisma: PrismaService) {}

  public async entitleIntegration({
    workspaceId,
    user,
    permittedAuthorities,
    integration
  }: IntegrationEntitlementParams): Promise<HydratedIntegration> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveWorkspaceAuthorities(
        workspaceId,
        user.id,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with integration ${integration.slug} for user ${user.id}`
    )

    const entitlements: HydratedIntegration['entitlements'] = {
      canDelete: this.isPermitted(
        Authority.DELETE_INTEGRATION,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_INTEGRATION,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with integration ${integration.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...integration,
      entitlements
    }
  }

  public async entitleSecret({
    project,
    user,
    permittedAuthorities,
    secret
  }: SecretEntitlementParams): Promise<RawEntitledSecret> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveProjectAuthorities(
        user.id,
        project,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with secret ${secret.slug} for user ${user.id}`
    )

    const entitlements: RawEntitledSecret['entitlements'] = {
      canDelete: this.isPermitted(
        Authority.DELETE_SECRET,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(Authority.UPDATE_SECRET, permittedAuthorities)
    }

    this.logger.log(
      `Associated entitlements with secret ${secret.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...secret,
      entitlements
    }
  }

  public async entitleVariable({
    project,
    user,
    permittedAuthorities,
    variable
  }: VariableEntitlementParams): Promise<RawEntitledVariable> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveProjectAuthorities(
        user.id,
        project,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with variable ${variable.slug} for user ${user.id}`
    )

    const entitlements: RawEntitledVariable['entitlements'] = {
      canDelete: this.isPermitted(
        Authority.DELETE_VARIABLE,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_VARIABLE,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with variable ${variable.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...variable,
      entitlements
    }
  }

  public async entitleEnvironment({
    environment,
    user,
    permittedAuthorities
  }: EnvironmentEntitlementParams): Promise<HydratedEnvironment> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveEnvironmentAuthorities(
        user.id,
        environment,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with environment ${environment.slug} for user ${user.id}`
    )

    const entitlements: HydratedEnvironment['entitlements'] = {
      canDelete: this.isPermitted(
        Authority.DELETE_ENVIRONMENT,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_ENVIRONMENT,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with environment ${environment.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...environment,
      entitlements
    }
  }

  public async entitleWorkspaceRole({
    workspaceRole,
    user,
    permittedAuthorities
  }: WorkspaceRoleEntitlementParams): Promise<HydratedWorkspaceRole> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveWorkspaceAuthorities(
        workspaceRole.workspaceId,
        user.id,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with workspace role ${workspaceRole.slug} for user ${user.id}`
    )

    const entitlements: HydratedWorkspaceRole['entitlements'] = {
      canDelete: this.isPermitted(
        Authority.DELETE_WORKSPACE_ROLE,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_WORKSPACE_ROLE,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with workspace role ${workspaceRole.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...workspaceRole,
      entitlements
    }
  }

  public async entitleWorkspaceMember({
    workspaceMember,
    user,
    permittedAuthorities
  }: WorkspaceMemberEntitlementParams): Promise<HydratedWorkspaceMember> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveWorkspaceAuthorities(
        workspaceMember.workspaceId,
        user.id,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with workspace member ${workspaceMember.id} for user ${user.id}`
    )

    const entitlements: HydratedWorkspaceMember['entitlements'] = {
      canCancelInvitation: this.isPermitted(
        Authority.ADD_USER,
        permittedAuthorities
      ),
      canResendInvitation: this.isPermitted(
        Authority.ADD_USER,
        permittedAuthorities
      ),
      canRemove: this.isPermitted(Authority.ADD_USER, permittedAuthorities),
      canTransferOwnershipTo: this.isPermitted(
        Authority.WORKSPACE_ADMIN,
        permittedAuthorities
      ),
      canUpdateRoles: this.isPermitted(
        Authority.UPDATE_USER_ROLE,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with workspace member ${workspaceMember.id} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...workspaceMember,
      entitlements
    }
  }

  public async entitleProject({
    project,
    user,
    permittedAuthorities,
    tierLimitService,
    authorizationService
  }: ProjectEntitlementParams): Promise<HydratedProject> {
    if (!permittedAuthorities) {
      permittedAuthorities =
        project.accessLevel === ProjectAccessLevel.PRIVATE
          ? await getCollectiveProjectAuthorities(user.id, project, this.prisma)
          : await getCollectiveWorkspaceAuthorities(
              project.workspaceId,
              user.id,
              this.prisma
            )
    }

    this.logger.log(
      `Associating entitlements with project ${project.slug} for user ${user.id}`
    )

    const entitlements: HydratedProject['entitlements'] = {
      canReadSecrets: this.isPermitted(
        Authority.READ_SECRET,
        permittedAuthorities
      ),
      canCreateSecrets: this.isPermitted(
        Authority.CREATE_SECRET,
        permittedAuthorities
      ),
      canReadVariables: this.isPermitted(
        Authority.READ_VARIABLE,
        permittedAuthorities
      ),
      canCreateVariables: this.isPermitted(
        Authority.CREATE_VARIABLE,
        permittedAuthorities
      ),
      canReadEnvironments: this.isPermitted(
        Authority.READ_ENVIRONMENT,
        permittedAuthorities
      ),
      canCreateEnvironments: this.isPermitted(
        Authority.CREATE_ENVIRONMENT,
        permittedAuthorities
      ),
      canDelete: this.isPermitted(
        Authority.DELETE_PROJECT,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_PROJECT,
        permittedAuthorities
      )
    }

    this.logger.log(
      `Associated entitlements with project ${project.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    const hydratedProject: HydratedProject = {
      ...project,
      ...(await this.parseProjectItemLimits(project.id, tierLimitService)),
      ...(await this.countEnvironmentsVariablesAndSecretsInProject(
        project,
        user,
        authorizationService
      )),
      entitlements,
      secretCount: project.secrets.length,
      variableCount: project.variables.length,
      environmentCount: project.environments.length
    }

    delete hydratedProject['secrets']
    delete hydratedProject['variables']
    delete hydratedProject['environments']

    return hydratedProject
  }

  /**
   * Checks if the given authority is present in the set of permitted authorities.
   *
   * @param authority The authority to check for permission.
   * @param permittedAuthorities The set of authorities that are permitted.
   * @returns true if the authority is included in the permitted authorities or if
   * the WORKSPACE_ADMIN authority is present; false otherwise.
   */
  private isPermitted(
    authority: Authority,
    permittedAuthorities: Set<Authority>
  ) {
    return (
      permittedAuthorities.has(authority) ||
      permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    )
  }

  /**
   * Parses the item limits for a project. This includes the maximum allowed number
   * of environments, secrets, and variables, as well as the total number of each
   * currently in the project.
   *
   * @param projectId The ID of the project to parse the item limits for.
   * @param tierLimitService The tier limit service to use for getting the tier
   * limits.
   * @returns An object with the maximum allowed number of environments, secrets,
   * and variables, as well as the total number of each currently in the project.
   */
  private async parseProjectItemLimits(
    projectId: Project['id'],
    tierLimitService: TierLimitService
  ): Promise<{
    maxAllowedEnvironments: number
    totalEnvironments: number
    maxAllowedSecrets: number
    totalSecrets: number
    maxAllowedVariables: number
    totalVariables: number
  }> {
    this.logger.log(`Parsing project item limits for project ${projectId}`)

    this.logger.log(`Getting environment tier limit for project ${projectId}`)
    // Get the tier limit for environments in the project
    const maxAllowedEnvironments =
      tierLimitService.getEnvironmentTierLimit(projectId)

    // Get the total number of environments in the project
    const totalEnvironments = await this.prisma.environment.count({
      where: {
        projectId
      }
    })
    this.logger.log(
      `Found ${totalEnvironments} environments in project ${projectId}`
    )

    this.logger.log(`Getting secret tier limit for project ${projectId}`)
    // Get the tier limit for secrets in the project
    const maxAllowedSecrets = tierLimitService.getSecretTierLimit(projectId)

    // Get the total number of secrets in the project
    const totalSecrets = await this.prisma.secret.count({
      where: {
        projectId
      }
    })
    this.logger.log(`Found ${totalSecrets} secrets in project ${projectId}`)

    this.logger.log(`Getting variable tier limit for project ${projectId}`)
    // Get the tier limit for variables in the project
    const maxAllowedVariables = tierLimitService.getVariableTierLimit(projectId)

    // Get the total number of variables in the project
    const totalVariables = await this.prisma.variable.count({
      where: {
        projectId
      }
    })
    this.logger.log(`Found ${totalVariables} variables in project ${projectId}`)

    return {
      maxAllowedEnvironments,
      totalEnvironments,
      maxAllowedSecrets,
      totalSecrets,
      maxAllowedVariables,
      totalVariables
    }
  }

  /**
   * Counts the number of environments, variables and secrets in a project that the user has access to.
   * @param project the project to count the items in
   * @param user the user performing the action
   * @param authorizationService the service to use to check if the user has access to the items
   * @returns an object with the counts of environments, variables and secrets
   */
  private async countEnvironmentsVariablesAndSecretsInProject(
    project: RawProject,
    user: AuthenticatedUser,
    authorizationService: AuthorizationService
  ): Promise<{
    secretCount: number
    variableCount: number
    environmentCount: number
  }> {
    this.logger.log(
      `Counting environments, variables and secrets in project ${project.slug}`
    )

    this.logger.log(`Fetching all environments of project ${project.slug}`)
    const allEnvs = await this.prisma.environment.findMany({
      where: { projectId: project.id }
    })
    this.logger.log(
      `Found ${allEnvs.length} environments in project ${project.slug}`
    )

    const permittedEnvironments = []

    this.logger.log(
      `Checking access to all environments of project ${project.slug}`
    )
    for (const env of allEnvs) {
      this.logger.log(
        `Checking access to environment ${env.slug} of project ${project.slug}`
      )
      try {
        const permittedEnv =
          await authorizationService.authorizeUserAccessToEnvironment({
            user,
            authorities:
              project.accessLevel == ProjectAccessLevel.GLOBAL
                ? []
                : [
                    Authority.READ_ENVIRONMENT,
                    Authority.READ_SECRET,
                    Authority.READ_VARIABLE
                  ],
            slug: env.slug
          })

        this.logger.log(
          `User has access to environment ${env.slug} of project ${project.slug}`
        )
        permittedEnvironments.push(permittedEnv)
      } catch (e) {
        this.logger.log(
          `User does not have access to environment ${env.slug} of project ${project.slug}`
        )
      }
    }

    const envPromises = permittedEnvironments.map(async (env: Environment) => {
      const fetchSecretCount = this.prisma.secret.count({
        where: {
          projectId: project.id,
          versions: { some: { environmentId: env.id } }
        }
      })

      const fetchVariableCount = this.prisma.variable.count({
        where: {
          projectId: project.id,
          versions: { some: { environmentId: env.id } }
        }
      })

      return this.prisma.$transaction([fetchSecretCount, fetchVariableCount])
    })

    this.logger.log(
      `Fetching counts of variables and secrets in project ${project.slug}`
    )
    const counts = await Promise.all(envPromises)
    const secretCount = counts.reduce(
      (sum, [secretCount]) => sum + secretCount,
      0
    )
    const variableCount = counts.reduce(
      (sum, [, variableCount]) => sum + variableCount,
      0
    )
    this.logger.log(
      `Found ${variableCount} variables and ${secretCount} secrets in project ${project.slug}`
    )

    return {
      environmentCount: permittedEnvironments.length,
      variableCount,
      secretCount
    }
  }
}
