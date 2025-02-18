import {
  PrismaClient,
  Authority,
  Workspace,
  ProjectAccessLevel
} from '@prisma/client'
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
import { CustomLoggerService } from './logger.service'
import {
  getCollectiveEnvironmentAuthorities,
  getCollectiveProjectAuthorities,
  getCollectiveWorkspaceAuthorities
} from './collective-authorities'
import { IntegrationWithWorkspace } from '@/integration/integration.types'
import { constructErrorBody } from './util'

export interface AuthorityInput {
  userId: string
  authorities: Authority[]
  prisma: PrismaClient
  entity: { slug?: string; name?: string }
}

@Injectable()
export class AuthorityCheckerService {
  constructor(private customLoggerService: CustomLoggerService) {}

  /**
   * Checks if the user has the required authorities to access the given workspace.
   *
   * @param input The input object containing the userId, entity, authorities, and prisma client
   * @returns The workspace if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverWorkspace(
    input: AuthorityInput
  ): Promise<Workspace> {
    const { userId, entity, authorities, prisma } = input

    let workspace: Workspace

    try {
      if (entity.slug) {
        workspace = await prisma.workspace.findUnique({
          where: {
            slug: entity.slug
          }
        })
      } else {
        workspace = await prisma.workspace.findFirst({
          where: {
            name: entity.name,
            members: { some: { userId: userId } }
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!workspace) {
      throw new NotFoundException(
        constructErrorBody(
          'Workspace not found',
          `Workspace ${entity.slug} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      workspace.id,
      userId,
      prisma
    )

    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)

    return workspace
  }

  /**
   * Checks if the user has the required authorities to access the given project.
   *
   * @param input The input object containing the userId, entity, authorities, and prisma client
   * @returns The project if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the project is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverProject(
    input: AuthorityInput
  ): Promise<ProjectWithSecrets> {
    const { userId, entity, authorities, prisma } = input

    let project: ProjectWithSecrets

    try {
      if (entity.slug) {
        project = await prisma.project.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            secrets: true
          }
        })
      } else {
        project = await prisma.project.findFirst({
          where: {
            name: entity.name,
            workspace: { members: { some: { userId: userId } } }
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
      await getCollectiveProjectAuthorities(userId, project, prisma)

    const permittedAuthoritiesForWorkspace: Set<Authority> =
      await getCollectiveWorkspaceAuthorities(
        project.workspaceId,
        userId,
        prisma
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
            authorities
          )
        }
        break
      case ProjectAccessLevel.INTERNAL:
        this.checkHasPermissionOverEntity(
          permittedAuthoritiesForWorkspace,
          authorities
        )
        break
      case ProjectAccessLevel.PRIVATE:
        this.checkHasPermissionOverEntity(
          permittedAuthoritiesForProject,
          authorities
        )
        break
    }

    return project
  }

  /**
   * Checks if the user has the required authorities to access the given environment.
   *
   * @param input The input object containing the userId, entity, authorities, and prisma client
   * @returns The environment if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the environment is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverEnvironment(
    input: AuthorityInput
  ): Promise<EnvironmentWithProject> {
    const { userId, entity, authorities, prisma } = input

    let environment: EnvironmentWithProject

    try {
      if (entity.slug) {
        environment = await prisma.environment.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            project: true
          }
        })
      } else {
        environment = await prisma.environment.findFirst({
          where: {
            name: entity.name,
            project: { workspace: { members: { some: { userId: userId } } } }
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
      userId,
      environment,
      prisma
    )

    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)

    return environment
  }

  /**
   * Checks if the user has the required authorities to access the given variable.
   *
   * @param input The input object containing the userId, entity, authorities, and prisma client
   * @returns The variable if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the variable is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverVariable(
    input: AuthorityInput
  ): Promise<VariableWithProjectAndVersion> {
    const { userId, entity, authorities, prisma } = input

    let variable: VariableWithProjectAndVersion

    try {
      if (entity.slug) {
        variable = await prisma.variable.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            versions: true,
            project: true
          }
        })
      } else {
        variable = await prisma.variable.findFirst({
          where: {
            name: entity.name,
            project: { workspace: { members: { some: { userId: userId } } } }
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
      userId,
      variable.project,
      prisma
    )

    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)

    return variable
  }

  /**
   * Checks if the user has the required authorities to access the given secret.
   *
   * @param input The input object containing the userId, entity, authorities, and prisma client
   * @returns The secret if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the secret is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverSecret(
    input: AuthorityInput
  ): Promise<SecretWithProjectAndVersion> {
    const { userId, entity, authorities, prisma } = input

    let secret: SecretWithProjectAndVersion

    try {
      if (entity.slug) {
        secret = await prisma.secret.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            versions: true,
            project: true
          }
        })
      } else {
        secret = await prisma.secret.findFirst({
          where: {
            name: entity.name,
            project: { workspace: { members: { some: { userId: userId } } } }
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
      userId,
      secret.project,
      prisma
    )

    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)

    return secret
  }

  /**
   * Checks if the user has the required authorities to access the given integration.
   *
   * @param input The input object containing the userId, entity, authorities, and prisma client
   * @returns The integration if the user has the required authorities
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the integration is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   */
  public async checkAuthorityOverIntegration(
    input: AuthorityInput
  ): Promise<IntegrationWithWorkspace> {
    const { userId, entity, authorities, prisma } = input

    let integration: IntegrationWithWorkspace | null

    try {
      if (entity.slug) {
        integration = await prisma.integration.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            workspace: true
          }
        })
      } else {
        integration = await prisma.integration.findFirst({
          where: {
            name: entity.name,
            workspace: { members: { some: { userId: userId } } }
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
      userId,
      prisma
    )

    this.checkHasPermissionOverEntity(permittedAuthorities, authorities)

    if (integration.projectId) {
      const project = await prisma.project.findUnique({
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
        userId,
        project,
        prisma
      )

      this.checkHasPermissionOverEntity(projectAuthorities, authorities)
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
