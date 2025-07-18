import { Authority, ProjectAccessLevel } from '@prisma/client'
import { RawEntitledVariable, RawVariable } from '@/variable/variable.types'
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import {
  HydratedEnvironment,
  RawEnvironment
} from '@/environment/environment.types'
import { ProjectWithSecrets } from '@/project/project.types'
import { RawEntitledSecret, RawSecret } from '@/secret/secret.types'
import {
  getCollectiveEnvironmentAuthorities,
  getCollectiveProjectAuthorities,
  getCollectiveWorkspaceAuthorities
} from '@/common/collective-authorities'
import {
  HydratedIntegration,
  RawIntegration
} from '@/integration/integration.types'
import { PrismaService } from '@/prisma/prisma.service'
import { constructErrorBody } from '@/common/util'
import { AuthorizationParams } from '../auth.types'
import {
  WorkspaceWithLastUpdateBy,
  WorkspaceWithLastUpdatedByAndOwner
} from '@/workspace/workspace.types'
import { associateWorkspaceOwnerDetails } from '@/common/workspace'
import { EntitlementService } from '@/common/entitlement.service'
import { InclusionQuery } from '@/common/inclusion-query'
import {
  HydratedWorkspaceRole,
  RawWorkspaceRole
} from '@/workspace-role/workspace-role.types'

@Injectable()
export class AuthorityCheckerService {
  private readonly logger = new Logger(AuthorityCheckerService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementService: EntitlementService
  ) {}

  /**
   * Checks if the user has the required authorities to access the given workspace.
   *
   * @param params The input object containing the user, slug, authorities
   * @returns The workspace if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverWorkspace(
    params: AuthorizationParams
  ): Promise<WorkspaceWithLastUpdatedByAndOwner> {
    const { user, slug, authorities } = params
    this.logger.log(
      `Checking authority over workspace for user ${user.id}, slug ${JSON.stringify(slug)} and authorities ${authorities}`
    )

    let workspace: WorkspaceWithLastUpdateBy

    try {
      this.logger.log(`Fetching workspace by slug ${slug}`)
      workspace = await this.prisma.workspace.findUnique({
        where: {
          slug: slug
        },
        include: {
          lastUpdatedBy: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true
            }
          }
        }
      })
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!workspace) {
      this.logger.warn(`Workspace ${slug} not found`)
      throw new NotFoundException(
        constructErrorBody('Workspace not found', `Workspace ${slug} not found`)
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      workspace.id,
      user.id,
      this.prisma
    )

    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access workspace ${workspace.slug} for authorities ${authorities}`
    )

    return await associateWorkspaceOwnerDetails(workspace, this.prisma)
  }

  /**
   * Checks if the user has the required authorities to access the given project.
   *
   * @param params The input object containing the user, slug, authorities
   * @returns The project if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the project is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverProject(
    params: AuthorizationParams
  ): Promise<ProjectWithSecrets> {
    const { user, slug, authorities } = params
    this.logger.log(
      `Checking authority over project for user ${user.id}, slug ${JSON.stringify(slug)} and authorities ${authorities}`
    )

    let project: ProjectWithSecrets

    try {
      this.logger.log(`Fetching project by slug ${slug}`)
      project = await this.prisma.project.findUnique({
        where: {
          slug: slug
        },
        include: {
          secrets: true,
          lastUpdatedBy: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true
            }
          }
        }
      })
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!project) {
      this.logger.warn(`Project ${slug} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Project not found',
          `Project ${slug} does not exist`
        )
      )
    }

    const permittedAuthoritiesForProject: Set<Authority> =
      await getCollectiveProjectAuthorities(user.id, project, this.prisma)

    const permittedAuthoritiesForWorkspace: Set<Authority> =
      await getCollectiveWorkspaceAuthorities(
        project.workspaceId,
        user.id,
        this.prisma
      )

    const projectAccessLevel = project.accessLevel
    this.logger.log(
      `Project ${project.slug} has access level ${projectAccessLevel}`
    )
    switch (projectAccessLevel) {
      case ProjectAccessLevel.GLOBAL:
        if (
          authorities.length !== 1 ||
          !authorities.includes(Authority.READ_PROJECT)
        ) {
          this.checkHasPermissionOverEntity(
            permittedAuthoritiesForWorkspace,
            authorities,
            user.id
          )
        }
        break
      case ProjectAccessLevel.INTERNAL:
        this.checkHasPermissionOverEntity(
          permittedAuthoritiesForWorkspace,
          authorities,
          user.id
        )
        break
      case ProjectAccessLevel.PRIVATE:
        this.checkHasPermissionOverEntity(
          permittedAuthoritiesForProject,
          authorities,
          user.id
        )
        break
    }

    this.logger.log(
      `User ${user.id} is cleared to access project ${project.slug} for authorities ${authorities}`
    )
    return project
  }

  /**
   * Checks if the user has the required authorities to access the given environment.
   *
   * @param params The input object containing the user, slug, authorities
   * @returns The environment if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the environment is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverEnvironment(
    params: AuthorizationParams
  ): Promise<HydratedEnvironment> {
    const { user, slug, authorities } = params
    this.logger.log(
      `Checking authority over environment for user ${user.id}, slug ${JSON.stringify(
        slug
      )} and authorities ${authorities}`
    )

    let environment: RawEnvironment

    try {
      this.logger.log(`Fetching environment by slug ${slug}`)
      environment = await this.prisma.environment.findUnique({
        where: {
          slug: slug
        },
        include: InclusionQuery.Environment
      })
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!environment) {
      this.logger.warn(`Environment ${slug} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Environment not found',
          `Environment ${slug} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveEnvironmentAuthorities(
      user.id,
      environment,
      this.prisma
    )

    this.logger.log(
      `Checking if user ${user.id} has authorities ${authorities} for environment ${environment.slug}`
    )
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    const entitlements: HydratedEnvironment['entitlements'] = {
      canDelete: permittedAuthorities.has(Authority.DELETE_ENVIRONMENT),
      canUpdate: permittedAuthorities.has(Authority.UPDATE_ENVIRONMENT)
    }

    this.logger.log(
      `User ${user.id} is cleared to access environment ${environment.slug} for authorities ${authorities}`
    )
    return {
      ...environment,
      entitlements
    }
  }

  /**
   * Checks if the user has the required authorities to access the given variable.
   *
   * @param params The input object containing the user, slug, authorities
   * @returns The variable if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the variable is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverVariable(
    params: AuthorizationParams
  ): Promise<RawEntitledVariable> {
    const { user, slug, authorities } = params
    this.logger.log(
      `Checking authority over variable for user ${user.id}, slug ${JSON.stringify(
        slug
      )} and authorities ${authorities}`
    )

    let variable: RawVariable

    try {
      this.logger.log(`Fetching variable by slug ${slug}`)
      variable = await this.prisma.variable.findUnique({
        where: {
          slug: slug
        },
        include: InclusionQuery.Variable
      })
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!variable) {
      this.logger.warn(`Variable ${slug} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Variable not found',
          `Variable ${slug} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveProjectAuthorities(
      user.id,
      variable.project,
      this.prisma
    )

    this.logger.log(
      `Checking if user ${user.id} has authorities ${authorities} for variable ${variable.slug}`
    )
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access variable ${variable.slug} for authorities ${authorities}`
    )

    return await this.entitlementService.entitleVariable({
      project: variable.project,
      user,
      permittedAuthorities,
      variable
    })
  }

  /**
   * Checks if the user has the required authorities to access the given secret.
   *
   * @param params The input object containing the user, slug, authorities
   * @returns The secret if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the secret is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverSecret(
    params: AuthorizationParams
  ): Promise<RawEntitledSecret> {
    const { user, slug, authorities } = params

    let secret: RawSecret

    this.logger.log(
      `Checking authority over secret for user ${user.id}, slug ${JSON.stringify(
        slug
      )} and authorities ${authorities}`
    )

    try {
      this.logger.log(`Fetching secret by slug ${slug}`)
      secret = await this.prisma.secret.findUnique({
        where: {
          slug: slug
        },
        include: InclusionQuery.Secret
      })
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!secret) {
      this.logger.warn(`Secret ${slug} not found`)
      throw new NotFoundException(
        constructErrorBody('Secret not found', `Secret ${slug} does not exist`)
      )
    }

    const permittedAuthorities = await getCollectiveProjectAuthorities(
      user.id,
      secret.project,
      this.prisma
    )

    this.logger.log(
      `Checking if user ${user.id} has authorities ${authorities} for secret ${secret.slug}`
    )
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access secret ${secret.slug} for authorities ${authorities}`
    )

    return await this.entitlementService.entitleSecret({
      secret,
      project: secret.project,
      user,
      permittedAuthorities
    })
  }

  /**
   * Checks if the user has the required authorities to access the given integration.
   *
   * @param params The input object containing the user, slug, authorities
   * @returns The integration if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the integration is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverIntegration(
    params: AuthorizationParams
  ): Promise<HydratedIntegration> {
    const { user, slug, authorities } = params
    this.logger.log(
      `Checking authority over integration for user ${user.id}, slug ${JSON.stringify(slug)} and authorities ${authorities}`
    )

    let integration: RawIntegration

    try {
      this.logger.log(`Fetching integration by slug ${slug}`)
      integration = await this.prisma.integration.findUnique({
        where: {
          slug: slug
        },
        include: InclusionQuery.Integration
      })
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!integration) {
      this.logger.warn(`Integration ${slug} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Integration not found',
          `Integration ${slug} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      integration.workspaceId,
      user.id,
      this.prisma
    )

    this.logger.log(
      `Checking if user ${user.id} has authorities ${authorities} for integration ${integration.slug}`
    )
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    if (integration.projectId) {
      this.logger.log(`Fetching project by ID ${integration.projectId}`)
      const project = await this.prisma.project.findUnique({
        where: {
          id: integration.projectId
        }
      })

      if (!project) {
        this.logger.warn(`Project with ID ${integration.projectId} not found`)
        throw new NotFoundException(
          `Project with ID ${integration.projectId} not found`
        )
      }

      const projectAuthorities = await getCollectiveProjectAuthorities(
        user.id,
        project,
        this.prisma
      )

      this.logger.log(
        `Checking if user ${user.id} has authorities ${authorities} for project ${project.id}`
      )
      this.checkHasPermissionOverEntity(
        projectAuthorities,
        authorities,
        user.id
      )
    }

    this.logger.log(
      `User ${user.id} is cleared to access integration ${integration.slug} for authorities ${authorities}`
    )

    return await this.entitlementService.entitleIntegration({
      integration,
      workspaceId: integration.workspaceId,
      user,
      permittedAuthorities
    })
  }

  public async checkAuthorityOverWorkspaceRole(
    params: AuthorizationParams
  ): Promise<HydratedWorkspaceRole> {
    const { user, slug, authorities } = params
    this.logger.log(
      `Checking authority over workspace role for user ${user.id}, slug ${JSON.stringify(slug)} and authorities ${authorities}`
    )

    let workspaceRole: RawWorkspaceRole

    try {
      this.logger.log(`Fetching workspace role by slug ${slug}`)
      workspaceRole = await this.prisma.workspaceRole.findUnique({
        where: {
          slug: slug
        },
        include: InclusionQuery.WorkspaceRole
      })
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!workspaceRole) {
      this.logger.warn(`Workspace role ${slug} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Workspace role not found',
          `Workspace role ${slug} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      workspaceRole.workspaceId,
      user.id,
      this.prisma
    )

    this.logger.log(
      `Checking if user ${user.id} has authorities ${authorities} for workspace role ${workspaceRole.slug}`
    )
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access workspace role ${workspaceRole.slug} for authorities ${authorities}`
    )

    return await this.entitlementService.entitleWorkspaceRole({
      workspaceRole,
      user,
      permittedAuthorities
    })
  }

  /**
   * Checks if the user has all the required authorities to perform an action.
   * Throws UnauthorizedException if the user does not have all the required authorities.
   *
   * @param permittedAuthorities The set of authorities that the user has
   * @param authorities The set of authorities required to perform the action
   * @param userId The slug of the user
   * @returns void
   * @throws UnauthorizedException if the user does not have all the required authorities
   */
  private checkHasPermissionOverEntity(
    permittedAuthorities: Set<Authority>,
    authorities: Authority[],
    userId: string
  ): void {
    this.logger.log(
      `Checking if user ${userId} has all the required authorities: ${authorities}`
    )

    // We commence the check if WORKSPACE_ADMIN isn't in the list of permitted authorities
    if (!permittedAuthorities.has(Authority.WORKSPACE_ADMIN)) {
      this.logger.log(
        `User ${userId} does not have the WORKSPACE_ADMIN authority`
      )

      // Check if the authority object passed is completely contained within the permitted authorities
      const hasRequiredAuthority = authorities.every((auth) =>
        permittedAuthorities.has(auth)
      )

      this.logger.log(`Required authorities for user ${userId}: ${authorities}`)
      this.logger.log(
        `Permitted authorities for user ${userId}: ${Array.from(
          permittedAuthorities
        )}`
      )

      if (!hasRequiredAuthority) {
        this.logger.log(
          `User ${userId} does not have all the required authorities`
        )
        throw new UnauthorizedException(
          constructErrorBody(
            'Insufficient permissions',
            `You do not have any of the required authorities to perform the action`
          )
        )
      } else {
        this.logger.log(`User ${userId} has all the required authorities`)
      }
    } else {
      this.logger.log(`User ${userId} has the WORKSPACE_ADMIN authority`)
    }
  }
}
