import { Authority, ProjectAccessLevel } from '@prisma/client'
import { HydratedVariable, RawVariable } from '@/variable/variable.types'
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
import { HydratedSecret, RawSecret } from '@/secret/secret.types'
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
import { HydratedWorkspace } from '@/workspace/workspace.types'
import { InclusionQuery } from '@/common/inclusion-query'
import {
  HydratedWorkspaceRole,
  RawWorkspaceRole
} from '@/workspace-role/workspace-role.types'
import { HydratedProject, RawProject } from '@/project/project.types'
import { AuthorizationService } from './authorization.service'
import { HydrationService } from '@/common/hydration.service'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'

@Injectable()
export class AuthorityCheckerService {
  private readonly logger = new Logger(AuthorityCheckerService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly hydrationService: HydrationService,
    private readonly workspaceCacheService: WorkspaceCacheService
  ) {}

  /**
   * Checks if the user has the required authorities to access the given workspace.
   *
   * @param params The input object containing the user, slug, authorities
   * @param authorizationService The authorization service to use for hydration
   * @returns The workspace if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws ForbiddenException if the user does not have the required authorities
   */
  public async checkAuthorityOverWorkspace(
    params: AuthorizationParams,
    authorizationService: AuthorizationService
  ): Promise<HydratedWorkspace> {
    const { user, slug, authorities } = params
    this.logger.log(
      `Checking authority over workspace for user ${user.id}, slug ${JSON.stringify(slug)} and authorities ${authorities}`
    )

    const workspace = await this.workspaceCacheService.getRawWorkspace(
      params.slug
    )

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      workspace.id,
      user.id,
      this.prisma,
      this.workspaceCacheService
    )

    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access workspace ${workspace.slug}`
    )

    return await this.hydrationService.hydrateWorkspace({
      workspace,
      user,
      permittedAuthorities,
      authorizationService
    })
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
    params: AuthorizationParams,
    authorizationService: AuthorizationService
  ): Promise<HydratedProject> {
    const { user, slug, authorities } = params
    this.logger.log(
      `Checking authority over project for user ${user.id}, slug ${JSON.stringify(slug)} and authorities ${authorities}`
    )

    let project: RawProject

    try {
      project = await this.prisma.project.findUnique({
        where: {
          slug: slug
        },
        include: InclusionQuery.Project
      })
    } catch (error) {
      this.logger.error('Error while fetching project: ', error)
      throw new InternalServerErrorException(
        constructErrorBody(
          'Uh-oh, something went wrong',
          'Something went wrong on our end. If the problem persists, please contact us.'
        )
      )
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

    const projectAccessLevel = project.accessLevel
    const permittedAuthorities =
      projectAccessLevel === ProjectAccessLevel.PRIVATE
        ? await getCollectiveProjectAuthorities(
            user.id,
            project,
            this.prisma,
            this.workspaceCacheService
          )
        : await getCollectiveWorkspaceAuthorities(
            project.workspaceId,
            user.id,
            this.prisma,
            this.workspaceCacheService
          )

    if (
      projectAccessLevel !== ProjectAccessLevel.GLOBAL ||
      authorities.length !== 1 ||
      !authorities.includes(Authority.READ_PROJECT)
    ) {
      this.checkHasPermissionOverEntity(
        permittedAuthorities,
        authorities,
        user.id
      )
    }

    this.logger.log(
      `User ${user.id} is cleared to access project ${project.slug} for authorities ${authorities}`
    )

    return await this.hydrationService.hydrateProject({
      project,
      user,
      permittedAuthorities,
      authorizationService
    })
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
      this.prisma,
      this.workspaceCacheService
    )

    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access environment ${environment.slug} for authorities ${authorities}`
    )
    return await this.hydrationService.hydrateEnvironment({
      environment,
      user,
      permittedAuthorities
    })
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
    params: AuthorizationParams,
    authorizationService: AuthorizationService
  ): Promise<HydratedVariable> {
    const { user, slug, authorities } = params
    this.logger.log(
      `Checking authority over variable for user ${user.id}, slug ${JSON.stringify(
        slug
      )} and authorities ${authorities}`
    )

    let variable: RawVariable

    try {
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
      this.prisma,
      this.workspaceCacheService
    )

    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access variable ${variable.slug} for authorities ${authorities}`
    )

    return await this.hydrationService.hydrateVariable({
      authorizationService,
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
    params: AuthorizationParams,
    authorizationService: AuthorizationService
  ): Promise<HydratedSecret> {
    const { user, slug, authorities } = params

    let secret: RawSecret

    this.logger.log(
      `Checking authority over secret for user ${user.id}, slug ${JSON.stringify(
        slug
      )} and authorities ${authorities}`
    )

    try {
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
      this.prisma,
      this.workspaceCacheService
    )

    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access secret ${secret.slug} for authorities ${authorities}`
    )

    return await this.hydrationService.hydrateSecret({
      secret,
      authorizationService,
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
      this.prisma,
      this.workspaceCacheService
    )

    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    if (integration.projectId) {
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
        this.prisma,
        this.workspaceCacheService
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

    return await this.hydrationService.hydrateIntegration({
      integration,
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
      this.prisma,
      this.workspaceCacheService
    )

    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access workspace role ${workspaceRole.slug} for authorities ${authorities}`
    )

    return await this.hydrationService.hydrateWorkspaceRole({
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
    // We perform the check if WORKSPACE_ADMIN isn't in the list of permitted authorities
    if (!permittedAuthorities.has(Authority.WORKSPACE_ADMIN)) {
      this.logger.log(
        `User ${userId} does not have the WORKSPACE_ADMIN authority`
      )

      // Check if the authority object passed is completely contained within the permitted authorities
      const hasRequiredAuthority = authorities.every((auth) =>
        permittedAuthorities.has(auth)
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
