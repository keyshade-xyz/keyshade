import { Workspace, Authority, ProjectAccessLevel } from '@prisma/client'
import { VariableWithProjectAndVersion } from '@/variable/variable.types'
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { EnvironmentWithProject } from '@/environment/environment.types'
import { ProjectWithSecrets } from '@/project/project.types'
import { SecretWithProjectAndVersion } from '@/secret/secret.types'
import { CustomLoggerService } from '@/common/logger.service'
import {
  getCollectiveEnvironmentAuthorities,
  getCollectiveProjectAuthorities,
  getCollectiveWorkspaceAuthorities
} from '@/common/collective-authorities'
import { IntegrationWithWorkspace } from '@/integration/integration.types'
<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
import { constructErrorBody } from './util'

export interface AuthorityInput {
  userId: string
  authorities: Authority[]
  prisma: PrismaClient
  entity: { slug?: string; name?: string }
}
=======
import { AuthorizationParams } from './authorization.types'
import { PrismaService } from '@/prisma/prisma.service'
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts

@Injectable()
export class AuthorityCheckerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customLoggerService: CustomLoggerService
  ) {}

  /**
   * Checks if the user has the required authorities to access the given workspace.
   *
   * @param params The input object containing the user, entity, authorities
   * @returns The workspace if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverWorkspace(
    params: AuthorizationParams
  ): Promise<Workspace> {
    const { user, entity, authorities } = params

    let workspace: Workspace

    try {
      if (entity.slug) {
        workspace = await this.prisma.workspace.findUnique({
          where: {
            slug: entity.slug
          }
        })
      } else if (entity.name) {
        workspace = await this.prisma.workspace.findFirst({
          where: {
            name: entity.name,
            members: { some: { userId: user.id } }
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!workspace) {
      throw new NotFoundException(
<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
        constructErrorBody(
          'Workspace not found',
          `Workspace ${entity.slug} does not exist`
        )
=======
        `Workspace ${entity.slug ?? entity.name} not found`
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      workspace.id,
      user.id,
      this.prisma
    )

<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)
=======
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts

    return workspace
  }

  /**
   * Checks if the user has the required authorities to access the given project.
   *
   * @param params The input object containing the user, entity, authorities
   * @returns The project if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the project is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverProject(
    params: AuthorizationParams
  ): Promise<ProjectWithSecrets> {
    const { user, entity, authorities } = params

    let project: ProjectWithSecrets

    try {
      if (entity.slug) {
        project = await this.prisma.project.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            secrets: true
          }
        })
      } else {
        project = await this.prisma.project.findFirst({
          where: {
            name: entity.name,
            workspace: { members: { some: { userId: user.id } } }
          },
          include: {
            secrets: true
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!project) {
      throw new NotFoundException(
        constructErrorBody(
          'Project not found',
          `Project ${entity.slug} does not exist`
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
    switch (projectAccessLevel) {
      case ProjectAccessLevel.GLOBAL:
        // In the global case, we check if the authorities being passed in
        // contains just the READ_PROJECT authority. If not, we need to
        // check if the user has access to the other authorities mentioned as well.
        if (
          authorities.length !== 1 ||
          !authorities.includes(Authority.READ_PROJECT)
        ) {
          this.checkHasPermissionOverEntity(
            permittedAuthoritiesForWorkspace,
<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
            authorities
=======
            authorities,
            user.id
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts
          )
        }
        break
      case ProjectAccessLevel.INTERNAL:
        this.checkHasPermissionOverEntity(
          permittedAuthoritiesForWorkspace,
<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
          authorities
=======
          authorities,
          user.id
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts
        )
        break
      case ProjectAccessLevel.PRIVATE:
        this.checkHasPermissionOverEntity(
          permittedAuthoritiesForProject,
<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
          authorities
=======
          authorities,
          user.id
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts
        )
        break
    }

    return project
  }

  /**
   * Checks if the user has the required authorities to access the given environment.
   *
   * @param params The input object containing the user, entity, authorities
   * @returns The environment if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the environment is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverEnvironment(
    params: AuthorizationParams
  ): Promise<EnvironmentWithProject> {
    const { user, entity, authorities } = params

    let environment: EnvironmentWithProject

    try {
      if (entity.slug) {
        environment = await this.prisma.environment.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            project: true
          }
        })
      } else {
        environment = await this.prisma.environment.findFirst({
          where: {
            name: entity.name,
            project: { workspace: { members: { some: { userId: user.id } } } }
          },
          include: {
            project: true
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!environment) {
      throw new NotFoundException(
        constructErrorBody(
          'Environment not found',
          `Environment ${entity.slug} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveEnvironmentAuthorities(
      user.id,
      environment,
      this.prisma
    )

<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)
=======
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts

    return environment
  }

  /**
   * Checks if the user has the required authorities to access the given variable.
   *
   * @param params The input object containing the user, entity, authorities
   * @returns The variable if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the variable is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverVariable(
    params: AuthorizationParams
  ): Promise<VariableWithProjectAndVersion> {
    const { user, entity, authorities } = params

    let variable: VariableWithProjectAndVersion

    try {
      if (entity.slug) {
        variable = await this.prisma.variable.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            versions: true,
            project: true
          }
        })
      } else {
        variable = await this.prisma.variable.findFirst({
          where: {
            name: entity.name,
            project: { workspace: { members: { some: { userId: user.id } } } }
          },
          include: {
            versions: true,
            project: true
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!variable) {
      throw new NotFoundException(
        constructErrorBody(
          'Variable not found',
          `Variable ${entity.slug} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveProjectAuthorities(
      user.id,
      variable.project,
      this.prisma
    )

<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)
=======
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts

    return variable
  }

  /**
   * Checks if the user has the required authorities to access the given secret.
   *
   * @param params The input object containing the user, entity, authorities
   * @returns The secret if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the secret is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverSecret(
    params: AuthorizationParams
  ): Promise<SecretWithProjectAndVersion> {
    const { user, entity, authorities } = params

    let secret: SecretWithProjectAndVersion

    try {
      if (entity.slug) {
        secret = await this.prisma.secret.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            versions: true,
            project: true
          }
        })
      } else {
        secret = await this.prisma.secret.findFirst({
          where: {
            name: entity.name,
            project: { workspace: { members: { some: { userId: user.id } } } }
          },
          include: {
            versions: true,
            project: true
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!secret) {
      throw new NotFoundException(
        constructErrorBody(
          'Secret not found',
          `Secret ${entity.slug} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveProjectAuthorities(
      user.id,
      secret.project,
      this.prisma
    )

<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)
=======
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts

    return secret
  }

  /**
   * Checks if the user has the required authorities to access the given integration.
   *
   * @param params The input object containing the user, entity, authorities
   * @returns The integration if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the integration is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverIntegration(
    params: AuthorizationParams
  ): Promise<IntegrationWithWorkspace> {
    const { user, entity, authorities } = params

    let integration: IntegrationWithWorkspace | null

    try {
      if (entity.slug) {
        integration = await this.prisma.integration.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            workspace: true
          }
        })
      } else {
        integration = await this.prisma.integration.findFirst({
          where: {
            name: entity.name,
            workspace: { members: { some: { userId: user.id } } }
          },
          include: {
            workspace: true
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!integration) {
      throw new NotFoundException(
        constructErrorBody(
          'Integration not found',
          `Integration ${entity.slug} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      integration.workspaceId,
      user.id,
      this.prisma
    )

<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)
=======
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts

    if (integration.projectId) {
      const project = await this.prisma.project.findUnique({
        where: {
          id: integration.projectId
        }
      })

      if (!project) {
        throw new NotFoundException(
          `Project with ID ${integration.projectId} not found`
        )
      }

      const projectAuthorities = await getCollectiveProjectAuthorities(
        user.id,
        project,
        this.prisma
      )

<<<<<<< HEAD:apps/api/src/common/authority-checker.service.ts
      this.checkHasPermissionOverEntity(projectAuthorities, authorities)
=======
      this.checkHasPermissionOverEntity(
        projectAuthorities,
        authorities,
        user.id
      )
>>>>>>> 054ea92 (Blacklisted IP address filtering implemented):apps/api/src/auth/service/authority-checker.service.ts
    }

    return integration
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
    authorities: Authority[]
  ): void {
    // We commence the check if WORKSPACE_ADMIN isn't in the list of permitted authorities
    if (!permittedAuthorities.has(Authority.WORKSPACE_ADMIN)) {
      // Check if the authority object passed is completely contained within the permitted authorities
      const hasRequiredAuthority = authorities.every((auth) =>
        permittedAuthorities.has(auth)
      )

      if (!hasRequiredAuthority) {
        throw new UnauthorizedException(
          constructErrorBody(
            'Insufficient permissions',
            `You do not have any of the required authorities to perform the action`
          )
        )
      }
    }
  }
}
