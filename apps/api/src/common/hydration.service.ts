import {
  HydratedIntegration,
  RawIntegration
} from '@/integration/integration.types'
import { PrismaService } from '@/prisma/prisma.service'
import { AuthenticatedUser } from '@/user/user.types'
import { Injectable, Logger } from '@nestjs/common'
import { Authority, Environment, ProjectAccessLevel } from '@prisma/client'
import {
  getCollectiveEnvironmentAuthorities,
  getCollectiveProjectAuthorities,
  getCollectiveWorkspaceAuthorities
} from './collective-authorities'
import {
  HydratedSecret,
  RawSecret,
  SecretRevision
} from '@/secret/secret.types'
import {
  HydratedVariable,
  RawVariable,
  VariableRevision
} from '@/variable/variable.types'
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
import { HydratedWorkspace, RawWorkspace } from '@/workspace/workspace.types'

type RootHydrationParams = {
  user: AuthenticatedUser
  permittedAuthorities?: Set<Authority>
}

type IntegrationHydrationParams = RootHydrationParams & {
  integration: RawIntegration
}

type SecretHydrationParams = RootHydrationParams & {
  secret: RawSecret
  authorizationService: AuthorizationService
}

type VariableHydrationParams = RootHydrationParams & {
  variable: RawVariable
  authorizationService: AuthorizationService
}

type EnvironmentHydrationParams = RootHydrationParams & {
  environment: RawEnvironment
}

type WorkspaceRoleHydrationParams = RootHydrationParams & {
  workspaceRole: RawWorkspaceRole
}

type WorkspaceMemberHydrationParams = RootHydrationParams & {
  workspaceMember: RawWorkspaceMember
}

type ProjectHydrationParams = RootHydrationParams & {
  project: RawProject
  authorizationService: AuthorizationService
}

type WorkspaceHydrationParams = RootHydrationParams & {
  workspace: RawWorkspace
  authorizationService?: AuthorizationService // Will be null when creating a workspace
}

@Injectable()
export class HydrationService {
  private readonly logger = new Logger(HydrationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly tierLimitService: TierLimitService
  ) {}

  /**
   * Hydrates an integration with entitlements, based on the provided user, permitted authorities,
   * and integration.
   *
   * @param user The user to use when looking up the permitted authorities.
   * @param permittedAuthorities The permitted authorities of the user. If not provided, they will
   * be calculated based on the integration's workspace.
   * @param integration The integration to hydrate.
   * @returns The hydrated integration with associated entitlements.
   */
  public async hydrateIntegration({
    user,
    permittedAuthorities,
    integration
  }: IntegrationHydrationParams): Promise<HydratedIntegration> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveWorkspaceAuthorities(
        integration.workspaceId,
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

  /**
   * Hydrates a secret with entitlements, based on the provided user, permitted authorities,
   * secret, and authorization service.
   *
   * @param user The user to use when looking up the permitted authorities.
   * @param permittedAuthorities The permitted authorities of the user.
   * @param secret The secret to hydrate.
   * @param authorizationService The authorization service to use when looking up the versions of the secret.
   * @returns The hydrated secret.
   */
  public async hydrateSecret({
    user,
    permittedAuthorities,
    secret,
    authorizationService
  }: SecretHydrationParams): Promise<HydratedSecret> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveProjectAuthorities(
        user.id,
        secret.project,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with secret ${secret.slug} for user ${user.id}`
    )

    const entitlements: HydratedSecret['entitlements'] = {
      canDelete: this.isPermitted(
        Authority.DELETE_SECRET,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(Authority.UPDATE_SECRET, permittedAuthorities)
    }

    const versions: SecretRevision[] = await this.flattenSecretVersions(
      secret,
      user,
      authorizationService
    )

    this.logger.log(
      `Associated entitlements with secret ${secret.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...secret,
      entitlements,
      versions
    }
  }

  /**
   * Hydrates a variable with entitlements, based on the provided user, permitted authorities,
   * variable, and authorization service.
   *
   * @param user The user to use when looking up the permitted authorities.
   * @param permittedAuthorities The permitted authorities of the user.
   * @param variable The variable to hydrate.
   * @param authorizationService The authorization service to use when looking up the versions of the variable.
   * @returns The hydrated variable.
   */
  public async hydrateVariable({
    user,
    permittedAuthorities,
    variable,
    authorizationService
  }: VariableHydrationParams): Promise<HydratedVariable> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveProjectAuthorities(
        user.id,
        variable.project,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with variable ${variable.slug} for user ${user.id}`
    )

    const entitlements: HydratedVariable['entitlements'] = {
      canDelete: this.isPermitted(
        Authority.DELETE_VARIABLE,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_VARIABLE,
        permittedAuthorities
      )
    }

    const versions = await this.flattenVariableVersions(
      variable,
      user,
      authorizationService
    )

    this.logger.log(
      `Associated entitlements with variable ${variable.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    return {
      ...variable,
      entitlements,
      versions
    }
  }

  /**
   * Hydrates an environment with entitlements, based on the provided user, permitted authorities,
   * and prisma client.
   *
   * @param environment The environment to hydrate.
   * @param user The user to use when looking up the permitted authorities.
   * @param permittedAuthorities The permitted authorities of the user.
   * @returns The hydrated environment.
   */
  public async hydrateEnvironment({
    environment,
    user,
    permittedAuthorities
  }: EnvironmentHydrationParams): Promise<HydratedEnvironment> {
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

  /**
   * Hydrates a workspace role with entitlements, based on the provided user, permitted authorities,
   * and workspace role.
   *
   * @param workspaceRole The workspace role to hydrate.
   * @param user The user to use when looking up the permitted authorities.
   * @param permittedAuthorities The permitted authorities of the user.
   * @returns The hydrated workspace role.
   */
  public async hydrateWorkspaceRole({
    workspaceRole,
    user,
    permittedAuthorities
  }: WorkspaceRoleHydrationParams): Promise<HydratedWorkspaceRole> {
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

  /**
   * Hydrates a workspace member with entitlements, based on the provided user, permitted authorities,
   * and workspace member.
   *
   * @param workspaceMember The workspace member to hydrate.
   * @param user The user to use when looking up the permitted authorities.
   * @param permittedAuthorities The permitted authorities of the user.
   * @returns The hydrated workspace member.
   */
  public async hydrateWorkspaceMember({
    workspaceMember,
    user,
    permittedAuthorities
  }: WorkspaceMemberHydrationParams): Promise<HydratedWorkspaceMember> {
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

  /**
   * Hydrates a project with entitlements, based on the provided user, permitted authorities,
   * tier limit service, and authorization service.
   *
   * @param project The project to hydrate.
   * @param user The user to use when looking up the permitted authorities.
   * @param permittedAuthorities The permitted authorities of the user.
   * @param tierLimitService The tier limit service to use when looking up the project item limits.
   * @param authorizationService The authorization service to use when looking up the number of secrets, variables, and environments in the project.
   * @returns The hydrated project.
   */
  public async hydrateProject({
    project,
    user,
    permittedAuthorities,
    authorizationService
  }: ProjectHydrationParams): Promise<HydratedProject> {
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

    const tierLimits = await this.computeProjectLimits(project)
    const projectResources = await this.countAuthorizedProjectResources(
      project,
      user,
      authorizationService
    )

    delete project.environments
    delete project.variables
    delete project.secrets

    const hydratedProject: HydratedProject = {
      ...project,
      ...tierLimits,
      ...projectResources,
      entitlements
    }

    return hydratedProject
  }

  public async hydrateWorkspace({
    workspace,
    user,
    permittedAuthorities,
    authorizationService
  }: WorkspaceHydrationParams): Promise<HydratedWorkspace> {
    if (!permittedAuthorities) {
      permittedAuthorities = await getCollectiveWorkspaceAuthorities(
        workspace.id,
        user.id,
        this.prisma
      )
    }

    this.logger.log(
      `Associating entitlements with workspace ${workspace.slug} for user ${user.id}`
    )

    const entitlements: HydratedWorkspace['entitlements'] = {
      canReadMembers: this.isPermitted(
        Authority.READ_USERS,
        permittedAuthorities
      ),
      canInviteMembers: this.isPermitted(
        Authority.ADD_USER,
        permittedAuthorities
      ),
      canReadProjects: this.isPermitted(
        Authority.READ_PROJECT,
        permittedAuthorities
      ),
      canCreateProjects: this.isPermitted(
        Authority.CREATE_PROJECT,
        permittedAuthorities
      ),
      canReadRoles: this.isPermitted(
        Authority.READ_WORKSPACE_ROLE,
        permittedAuthorities
      ),
      canCreateRoles: this.isPermitted(
        Authority.CREATE_WORKSPACE_ROLE,
        permittedAuthorities
      ),
      canUpdate: this.isPermitted(
        Authority.UPDATE_WORKSPACE,
        permittedAuthorities
      ),
      canDelete: this.isPermitted(
        Authority.DELETE_WORKSPACE,
        permittedAuthorities
      )
    }

    const tierLimits = await this.computeWorkspaceLimits(workspace)
    const workspaceResources = authorizationService
      ? await this.countAuthorizedWorkspaceResources(
          workspace,
          user,
          authorizationService
        )
      : {
          projects: 0
        }

    this.logger.log(
      `Associated entitlements with workspace ${workspace.slug} for user ${user.id}: ${JSON.stringify(
        entitlements
      )}`
    )

    delete workspace.projects
    delete workspace.integrations
    delete workspace.members
    delete workspace.roles

    return {
      ...workspace,
      ...tierLimits,
      ...workspaceResources,
      entitlements,
      isDefault: workspace.isDefault && workspace.ownerId === user.id
    }
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
  private async computeProjectLimits(project: RawProject): Promise<{
    maxAllowedEnvironments: number
    totalEnvironments: number
    maxAllowedSecrets: number
    totalSecrets: number
    maxAllowedVariables: number
    totalVariables: number
  }> {
    const projectId = project.id
    this.logger.log(`Parsing project item limits for project ${projectId}`)

    this.logger.log(`Getting environment tier limit for project ${projectId}`)
    // Get the tier limit for environments in the project
    const maxAllowedEnvironments =
      this.tierLimitService.getEnvironmentTierLimit(projectId)

    // Get the total number of environments in the project
    const totalEnvironments = project.environments.length
    this.logger.log(
      `Found ${totalEnvironments} environments in project ${projectId}`
    )

    this.logger.log(`Getting secret tier limit for project ${projectId}`)
    // Get the tier limit for secrets in the project
    const maxAllowedSecrets =
      this.tierLimitService.getSecretTierLimit(projectId)

    // Get the total number of secrets in the project
    const totalSecrets = project.secrets.length
    this.logger.log(`Found ${totalSecrets} secrets in project ${projectId}`)

    this.logger.log(`Getting variable tier limit for project ${projectId}`)
    // Get the tier limit for variables in the project
    const maxAllowedVariables =
      this.tierLimitService.getVariableTierLimit(projectId)

    // Get the total number of variables in the project
    const totalVariables = project.variables.length
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
   * Parses the tier limits for a given workspace and returns an object containing
   * the maximum allowed and current total of members and projects.
   *
   * @param workspace The workspace to parse tier limits for.
   * @param tierLimitService The service used to obtain tier limits.
   * @param prisma The Prisma client for database operations.
   * @returns A promise that resolves to an object containing the workspace with
   * tier limits, including maximum allowed and total members and projects.
   */
  private async computeWorkspaceLimits(workspace: RawWorkspace): Promise<{
    maxAllowedProjects: number
    totalProjects: number
    maxAllowedMembers: number
    totalMembers: number
  }> {
    const workspaceId = workspace.id
    this.logger.log(
      `Parsing workspace item limits for workspace ${workspaceId}`
    )

    // Get the tier limit for the members in the workspace
    this.logger.log(`Getting member tier limit for workspace ${workspaceId}`)
    const maxAllowedMembers =
      this.tierLimitService.getMemberTierLimit(workspaceId)

    // Get total members in the workspace
    const totalMembers = workspace.members.length
    this.logger.log(`Found ${totalMembers} members in workspace ${workspaceId}`)

    // Get project tier limit
    this.logger.log(`Getting project tier limit for workspace ${workspaceId}`)
    const maxAllowedProjects =
      this.tierLimitService.getProjectTierLimit(workspaceId)

    // Get total projects in the workspace
    const totalProjects = workspace.projects.length
    this.logger.log(
      `Found ${totalProjects} projects in workspace ${workspaceId}`
    )

    return {
      maxAllowedMembers,
      totalMembers,
      maxAllowedProjects,
      totalProjects
    }
  }

  /**
   * Count the number of authorized environments, variables and secrets in a project.
   *
   * This function will check if the user has access to each environment in the project
   * and then fetch the counts of variables and secrets for each permitted environment.
   *
   * @param project The project to count the resources of.
   * @param user The user to check the access for.
   * @param authorizationService The authorization service to use for checking access.
   * @returns A promise that resolves with an object containing the counts of environments,
   * variables and secrets the user has access to in the project.
   */
  public async countAuthorizedProjectResources(
    project: RawProject,
    user: AuthenticatedUser,
    authorizationService: AuthorizationService
  ): Promise<{
    secrets: number
    variables: number
    environments: number
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
      environments: permittedEnvironments.length,
      secrets: secretCount,
      variables: variableCount
    }
  }

  /**
   * Counts the number of resources of a given type that are accessible to the
   * given user in the given workspace.
   *
   * @param workspace The workspace to count resources in.
   * @param user The user to check access for.
   * @param authorizationService The authorization service to use for checking
   * access.
   *
   * @returns An object with the count of accessible projects.
   */
  private async countAuthorizedWorkspaceResources(
    workspace: RawWorkspace,
    user: AuthenticatedUser,
    authorizationService: AuthorizationService
  ): Promise<{
    projects: number
  }> {
    const projects = await this.prisma.project.findMany({
      where: {
        workspaceId: workspace.id
      }
    })

    let accessibleProjectCount = 0

    for (const project of projects) {
      let hasAuthority = null
      try {
        hasAuthority = await authorizationService.authorizeUserAccessToProject({
          user,
          slug: project.slug,
          authorities: [Authority.READ_PROJECT]
        })
      } catch (_ignored) {
        this.logger.log(
          `User ${user.id} does not have access to project ${project.slug}`
        )
      }

      if (hasAuthority) {
        accessibleProjectCount++
      }
    }
    return {
      projects: accessibleProjectCount
    }
  }

  /**
   * Flatten a raw secret into a list of secret revisions that the user has access to.
   * This function takes into account the user's permissions to access each environment
   * that the secret is defined in.
   *
   * @param rawSecret The raw secret to flatten
   * @param user The authenticated user
   * @param authorizationService The authorization service to use for permission checks
   * @returns A list of secret revisions that the user has access to
   */
  private async flattenSecretVersions(
    rawSecret: RawSecret,
    user: AuthenticatedUser,
    authorizationService: AuthorizationService
  ): Promise<SecretRevision[]> {
    // Logic to update the map:
    // 1. If the environment ID is not present in the key, insert the environment ID and the secret version
    // 2. If the environment ID is already present, check if the existing secret version is lesser than the new secret version.
    //    If it is, update the secret version
    const envIdToSecretVersionMap = new Map<Environment['id'], SecretRevision>()

    // Maintain a list of environments that the user is and is not allowed to access
    const environmentAccessibilityMap: Map<Environment['id'], boolean> =
      new Map()

    for (const secretVersion of rawSecret.versions) {
      const environmentSlug = secretVersion.environment.slug

      if (!environmentAccessibilityMap.has(secretVersion.environment.id)) {
        try {
          await authorizationService.authorizeUserAccessToEnvironment({
            user,
            slug: environmentSlug,
            authorities: [Authority.READ_ENVIRONMENT]
          })
          environmentAccessibilityMap.set(secretVersion.environment.id, true)
        } catch (error) {
          environmentAccessibilityMap.set(secretVersion.environment.id, false)
        }
      }

      if (!environmentAccessibilityMap.get(secretVersion.environment.id)) {
        continue
      }

      const environmentId = secretVersion.environment.id
      const existingSecretVersion = envIdToSecretVersionMap.get(environmentId)

      if (
        !existingSecretVersion ||
        existingSecretVersion.version < secretVersion.version
      ) {
        envIdToSecretVersionMap.set(environmentId, secretVersion)
      }
    }

    return Array.from(envIdToSecretVersionMap.values()).map(
      (secretVersion) => ({
        environment: {
          id: secretVersion.environment.id,
          name: secretVersion.environment.name,
          slug: secretVersion.environment.slug
        },
        value: secretVersion.value,
        version: secretVersion.version,
        createdBy: {
          id: secretVersion.createdBy.id,
          name: secretVersion.createdBy.name,
          profilePictureUrl: secretVersion.createdBy.profilePictureUrl
        },
        createdOn: secretVersion.createdOn
      })
    )
  }

  /**
   * Flatten the variable versions, given a hydrated variable, user, and authorization service.
   *
   * The logic to flatten the variable versions is as follows:
   * 1. If the environment ID is not present in the key, insert the environment ID and the variable version
   * 2. If the environment ID is already present, check if the existing variable version is lesser than the new variable version.
   *    If it is, update the variable version
   *
   * The function returns an array of flattened variable versions.
   */
  private async flattenVariableVersions(
    hydratedVariable: RawVariable,
    user: AuthenticatedUser,
    authorizationService: AuthorizationService
  ): Promise<VariableRevision[]> {
    const envIdToVariableVersionMap = new Map<
      Environment['id'],
      VariableRevision
    >()

    // Maintain a list of environments that the user is and is not allowed to access
    const environmentAccessibilityMap: Map<Environment['id'], boolean> =
      new Map()

    for (const variableVersion of hydratedVariable.versions) {
      const environmentSlug = variableVersion.environment.slug

      if (!environmentAccessibilityMap.has(variableVersion.environment.id)) {
        try {
          await authorizationService.authorizeUserAccessToEnvironment({
            user,
            slug: environmentSlug,
            authorities: [Authority.READ_ENVIRONMENT]
          })
          environmentAccessibilityMap.set(variableVersion.environment.id, true)
        } catch (error) {
          environmentAccessibilityMap.set(variableVersion.environment.id, false)
        }
      }

      if (!environmentAccessibilityMap.get(variableVersion.environment.id)) {
        continue
      }

      const environmentId = variableVersion.environment.id
      const existingVariableVersion =
        envIdToVariableVersionMap.get(environmentId)

      if (
        !existingVariableVersion ||
        existingVariableVersion.version < variableVersion.version
      ) {
        envIdToVariableVersionMap.set(environmentId, variableVersion)
      }
    }

    return Array.from(envIdToVariableVersionMap.values()).map(
      (variableVersion) => ({
        environment: {
          id: variableVersion.environment.id,
          name: variableVersion.environment.name,
          slug: variableVersion.environment.slug
        },
        value: variableVersion.value,
        version: variableVersion.version,
        createdBy: {
          id: variableVersion.createdBy.id,
          name: variableVersion.createdBy.name,
          profilePictureUrl: variableVersion.createdBy.profilePictureUrl
        },
        createdOn: variableVersion.createdOn
      })
    )
  }
}
