import {
  PrismaClient,
  Authority,
  Workspace,
  Integration,
  ProjectAccessLevel
} from '@prisma/client'
import { VariableWithProjectAndVersion } from '../variable/variable.types'
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import getCollectiveProjectAuthorities from './get-collective-project-authorities'
import getCollectiveWorkspaceAuthorities from './get-collective-workspace-authorities'
import { EnvironmentWithProject } from '../environment/environment.types'
import { ProjectWithSecrets } from '../project/project.types'
import { SecretWithProjectAndVersion } from '../secret/secret.types'
import { CustomLoggerService } from './logger.service'

export interface AuthorityInput {
  userId: string
  authority: Authority
  prisma: PrismaClient
  entity: { id?: string; name?: string }
}

@Injectable()
export class AuthorityCheckerService {
  constructor(private customLoggerService: CustomLoggerService) {}

  public async checkAuthorityOverWorkspace(
    input: AuthorityInput
  ): Promise<Workspace> {
    const { userId, entity, authority, prisma } = input

    let workspace: Workspace

    try {
      if (entity.id) {
        workspace = await prisma.workspace.findUnique({
          where: {
            id: entity.id
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

    // Check if the workspace exists or not
    if (!workspace) {
      throw new NotFoundException(`Workspace with id ${entity.id} not found`)
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      entity.id,
      userId,
      prisma
    )

    // Check if the user has the authority to perform the action
    if (
      !permittedAuthorities.has(authority) &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    ) {
      throw new UnauthorizedException(
        `User ${userId} does not have the required authorities to perform the action`
      )
    }

    return workspace
  }

  public async checkAuthorityOverProject(
    input: AuthorityInput
  ): Promise<ProjectWithSecrets> {
    const { userId, entity, authority, prisma } = input

    // Fetch the project
    let project: ProjectWithSecrets

    try {
      if (entity.id) {
        project = await prisma.project.findUnique({
          where: {
            id: entity.id
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

    // If the project is not found, throw an error
    if (!project) {
      throw new NotFoundException(`Project with id ${entity.id} not found`)
    }

    // Get the authorities of the user in the workspace with the project
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
        // We will only allow reads for the project. If the authority is READ_PROJECT, we will allow access
        // For any other authority, the user needs to have the required collective authority over the workspace
        // or WORKSPACE_ADMIN authority
        if (authority !== Authority.READ_PROJECT) {
          if (
            !permittedAuthoritiesForWorkspace.has(authority) &&
            !permittedAuthoritiesForWorkspace.has(Authority.WORKSPACE_ADMIN)
          ) {
            throw new UnauthorizedException(
              `User with id ${userId} does not have the authority in the project with id ${entity.id}`
            )
          }
        }
        break
      case ProjectAccessLevel.INTERNAL:
        // Any workspace member with the required collective authority over the workspace or
        // WORKSPACE_ADMIN authority will be able to access the project
        if (
          !permittedAuthoritiesForWorkspace.has(authority) &&
          !permittedAuthoritiesForWorkspace.has(Authority.WORKSPACE_ADMIN)
        ) {
          throw new UnauthorizedException(
            `User with id ${userId} does not have the authority in the project with id ${entity.id}`
          )
        }
        break

      case ProjectAccessLevel.PRIVATE:
        // Any member with the required collective authority over the project or
        // a member with WORKSPACE_ADMIN authority will be able to access the project
        if (
          !permittedAuthoritiesForProject.has(authority) &&
          !permittedAuthoritiesForProject.has(Authority.WORKSPACE_ADMIN)
        ) {
          throw new UnauthorizedException(
            `User with id ${userId} does not have the authority in the project with id ${entity.id}`
          )
        }

        break
    }

    return project
  }

  public async checkAuthorityOverEnvironment(
    input: AuthorityInput
  ): Promise<EnvironmentWithProject> {
    const { userId, entity, authority, prisma } = input

    // Fetch the environment
    let environment: EnvironmentWithProject

    try {
      if (entity.id) {
        environment = await prisma.environment.findUnique({
          where: {
            id: entity.id
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
      throw new NotFoundException(`Environment with id ${entity.id} not found`)
    }

    const permittedAuthorities = await getCollectiveProjectAuthorities(
      userId,
      environment.project,
      prisma
    )

    // Check if the user has the required authorities
    if (
      !permittedAuthorities.has(authority) &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    ) {
      throw new UnauthorizedException(
        `User ${userId} does not have the required authorities`
      )
    }

    return environment
  }

  public async checkAuthorityOverVariable(
    input: AuthorityInput
  ): Promise<VariableWithProjectAndVersion> {
    const { userId, entity, authority, prisma } = input

    // Fetch the variable
    let variable: VariableWithProjectAndVersion

    try {
      if (entity.id) {
        variable = await prisma.variable.findUnique({
          where: {
            id: entity.id
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
      throw new NotFoundException(`Variable with id ${entity.id} not found`)
    }

    // Check if the user has the project in their workspace role list
    const permittedAuthorities = await getCollectiveProjectAuthorities(
      userId,
      variable.project,
      prisma
    )

    // Check if the user has the required authorities
    if (
      !permittedAuthorities.has(authority) &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    ) {
      throw new UnauthorizedException(
        `User ${userId} does not have the required authorities`
      )
    }

    return variable
  }

  public async checkAuthorityOverSecret(
    input: AuthorityInput
  ): Promise<SecretWithProjectAndVersion> {
    const { userId, entity, authority, prisma } = input

    // Fetch the secret
    let secret: SecretWithProjectAndVersion

    try {
      if (entity.id) {
        secret = await prisma.secret.findUnique({
          where: {
            id: entity.id
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
      throw new NotFoundException(`Secret with id ${entity.id} not found`)
    }

    // Check if the user has the project in their workspace role list
    const permittedAuthorities = await getCollectiveProjectAuthorities(
      userId,
      secret.project,
      prisma
    )

    // Check if the user has the required authorities
    if (
      !permittedAuthorities.has(authority) &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    ) {
      throw new UnauthorizedException(
        `User ${userId} does not have the required authorities`
      )
    }

    return secret
  }

  public async checkAuthorityOverIntegration(
    input: AuthorityInput
  ): Promise<Integration> {
    const { userId, entity, authority, prisma } = input

    // Fetch the integration
    let integration: Integration | null

    try {
      if (entity.id) {
        integration = await prisma.integration.findUnique({
          where: {
            id: entity.id
          }
        })
      } else {
        integration = await prisma.integration.findFirst({
          where: {
            name: entity.name,
            workspace: { members: { some: { userId: userId } } }
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!integration) {
      throw new NotFoundException(`Integration with id ${entity.id} not found`)
    }

    // Check if the user has the required authorities
    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      integration.workspaceId,
      userId,
      prisma
    )

    if (
      !permittedAuthorities.has(authority) &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    ) {
      throw new UnauthorizedException(
        `User ${userId} does not have the required authorities`
      )
    }

    // Additionally, we would also like to check the project authorities,
    // if the integration is associated with a project
    if (integration.projectId) {
      const project = await prisma.project.findUnique({
        where: {
          id: integration.projectId
        }
      })

      if (!project) {
        throw new NotFoundException(
          `Project with id ${integration.projectId} not found`
        )
      }

      const projectAuthorities = await getCollectiveProjectAuthorities(
        userId,
        project,
        prisma
      )

      if (
        !projectAuthorities.has(authority) &&
        !projectAuthorities.has(Authority.WORKSPACE_ADMIN)
      ) {
        throw new UnauthorizedException(
          `User ${userId} does not have the required authorities`
        )
      }
    }

    return integration
  }
}
