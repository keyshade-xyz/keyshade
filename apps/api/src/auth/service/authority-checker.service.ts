import { Authority, ProjectAccessLevel } from '@prisma/client'
import { VariableWithProjectAndVersion } from '@/variable/variable.types'
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { EnvironmentWithProject } from '@/environment/environment.types'
import { ProjectWithSecrets } from '@/project/project.types'
import { SecretWithProjectAndVersion } from '@/secret/secret.types'
import {
  getCollectiveEnvironmentAuthorities,
  getCollectiveProjectAuthorities,
  getCollectiveWorkspaceAuthorities
} from '@/common/collective-authorities'
import { IntegrationWithWorkspace } from '@/integration/integration.types'
import { PrismaService } from '@/prisma/prisma.service'
import { constructErrorBody } from '@/common/util'
import { AuthorizationParams } from '../auth.types'
import {
  WorkspaceWithLastUpdateBy,
  WorkspaceWithLastUpdatedByAndOwner
} from '@/workspace/workspace.types'
import { associateWorkspaceOwnerDetails } from '@/common/workspace'

@Injectable()
export class AuthorityCheckerService {
  private readonly logger = new Logger(AuthorityCheckerService.name)

  constructor(private readonly prisma: PrismaService) {}

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
  ): Promise<WorkspaceWithLastUpdatedByAndOwner> {
    const { user, entity, authorities } = params
    this.logger.log(
      `Checking authority over workspace for user ${user.id}, entity ${JSON.stringify(entity)} and authorities ${authorities}`
    )

    let workspace: WorkspaceWithLastUpdateBy

    try {
      if (entity.slug) {
        this.logger.log(`Fetching workspace by slug ${entity.slug}`)
        workspace = await this.prisma.workspace.findUnique({
          where: {
            slug: entity.slug
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
      } else if (entity.name) {
        this.logger.log(`Fetching workspace by name ${entity.name}`)
        workspace = await this.prisma.workspace.findFirst({
          where: {
            name: entity.name,
            members: { some: { userId: user.id } }
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
      }
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!workspace) {
      this.logger.warn(`Workspace ${entity.slug} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Workspace not found',
          `Workspace ${entity.slug ?? entity.name} not found`
        )
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      workspace.id,
      user.id,
      this.prisma,
      this.logger
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
    this.logger.log(
      `Checking authority over project for user ${user.id}, entity ${JSON.stringify(entity)} and authorities ${authorities}`
    )

    let project: ProjectWithSecrets

    try {
      if (entity.slug) {
        this.logger.log(`Fetching project by slug ${entity.slug}`)
        project = await this.prisma.project.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            secrets: true
          }
        })
      } else {
        this.logger.log(`Fetching project by name ${entity.name}`)
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
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!project) {
      this.logger.warn(`Project ${entity.slug} not found`)
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
        this.prisma,
        this.logger
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
    this.logger.log(
      `Checking authority over environment for user ${user.id}, entity ${JSON.stringify(
        entity
      )} and authorities ${authorities}`
    )

    let environment: EnvironmentWithProject

    try {
      if (entity.slug) {
        this.logger.log(`Fetching environment by slug ${entity.slug}`)
        environment = await this.prisma.environment.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            project: true
          }
        })
      } else {
        this.logger.log(`Fetching environment by name ${entity.name}`)
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
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!environment) {
      this.logger.warn(`Environment ${entity.slug} not found`)
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
      this.prisma,
      this.logger
    )

    this.logger.log(
      `Checking if user ${user.id} has authorities ${authorities} for environment ${environment.slug}`
    )
    this.checkHasPermissionOverEntity(
      permittedAuthorities,
      authorities,
      user.id
    )

    this.logger.log(
      `User ${user.id} is cleared to access environment ${environment.slug} for authorities ${authorities}`
    )
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
    this.logger.log(
      `Checking authority over variable for user ${user.id}, entity ${JSON.stringify(
        entity
      )} and authorities ${authorities}`
    )

    let variable: VariableWithProjectAndVersion

    const variableIncludeQuery = {
      versions: {
        select: {
          value: true,
          version: true,
          createdOn: true,
          environment: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true
            }
          }
        }
      },
      project: true
    }

    try {
      if (entity.slug) {
        this.logger.log(`Fetching variable by slug ${entity.slug}`)
        variable = await this.prisma.variable.findUnique({
          where: {
            slug: entity.slug
          },
          include: variableIncludeQuery
        })
      } else {
        this.logger.log(`Fetching variable by name ${entity.name}`)
        variable = await this.prisma.variable.findFirst({
          where: {
            name: entity.name,
            project: { workspace: { members: { some: { userId: user.id } } } }
          },
          include: variableIncludeQuery
        })
      }
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!variable) {
      this.logger.warn(`Variable ${entity.slug || entity.name} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Variable not found',
          `Variable ${entity.slug || entity.name} does not exist`
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

    this.logger.log(
      `Checking authority over secret for user ${user.id}, entity ${JSON.stringify(
        entity
      )} and authorities ${authorities}`
    )

    const secretIncludeQuery = {
      versions: {
        select: {
          value: true,
          version: true,
          createdOn: true,
          environment: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
              profilePictureUrl: true
            }
          }
        }
      },
      project: true
    }

    try {
      if (entity.slug) {
        this.logger.log(`Fetching secret by slug ${entity.slug}`)
        secret = await this.prisma.secret.findUnique({
          where: {
            slug: entity.slug
          },
          include: secretIncludeQuery
        })
      } else {
        this.logger.log(`Fetching secret by name ${entity.name}`)
        secret = await this.prisma.secret.findFirst({
          where: {
            name: entity.name,
            project: { workspace: { members: { some: { userId: user.id } } } }
          },
          include: secretIncludeQuery
        })
      }
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!secret) {
      this.logger.warn(`Secret ${entity.slug || entity.name} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Secret not found',
          `Secret ${entity.slug || entity.name} does not exist`
        )
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
    this.logger.log(
      `Checking authority over integration for user ${user.id}, entity ${JSON.stringify(entity)} and authorities ${authorities}`
    )

    let integration: IntegrationWithWorkspace | null

    try {
      if (entity.slug) {
        this.logger.log(`Fetching integration by slug ${entity.slug}`)
        integration = await this.prisma.integration.findUnique({
          where: {
            slug: entity.slug
          },
          include: {
            workspace: true
          }
        })
      } else {
        this.logger.log(`Fetching integration by name ${entity.name}`)
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
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!integration) {
      this.logger.warn(`Integration ${entity.slug || entity.name} not found`)
      throw new NotFoundException(
        constructErrorBody(
          'Integration not found',
          `Integration ${entity.slug || entity.name} does not exist`
        )
      )
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      integration.workspaceId,
      user.id,
      this.prisma,
      this.logger
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
