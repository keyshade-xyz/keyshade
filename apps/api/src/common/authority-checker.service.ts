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
  authorities: Authority[]
  prisma: PrismaClient
  entity: { id?: string; name?: string }
}

@Injectable()
export class AuthorityCheckerService {
  constructor(private customLoggerService: CustomLoggerService) {}

  public async checkAuthorityOverWorkspace(
    input: AuthorityInput
  ): Promise<Workspace> {
    const { userId, entity, authorities, prisma } = input

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

    if (!workspace) {
      throw new NotFoundException(`Workspace with id ${entity.id} not found`)
    }

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      entity.id,
      userId,
      prisma
    )

    const hasRequiredAuthority = authorities.some(
      (auth) =>
        permittedAuthorities.has(auth) ||
        permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    )

    if (!hasRequiredAuthority) {
      throw new UnauthorizedException(
        `User ${userId} does not have any of the required authorities to perform the action`
      )
    }

    return workspace
  }

  public async checkAuthorityOverProject(
    input: AuthorityInput
  ): Promise<ProjectWithSecrets> {
    const { userId, entity, authorities, prisma } = input

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

    if (!project) {
      throw new NotFoundException(`Project with id ${entity.id} not found`)
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
        if (!authorities.includes(Authority.READ_PROJECT)) {
          const hasRequiredAuthority = authorities.some(
            (auth) =>
              permittedAuthoritiesForWorkspace.has(auth) ||
              permittedAuthoritiesForWorkspace.has(Authority.WORKSPACE_ADMIN)
          )
          if (!hasRequiredAuthority) {
            throw new UnauthorizedException(
              `User with id ${userId} does not have any of the required authorities in the project with id ${entity.id}`
            )
          }
        }
        break
      case ProjectAccessLevel.INTERNAL:
        const hasRequiredAuthorityInternal = authorities.some(
          (auth) =>
            permittedAuthoritiesForWorkspace.has(auth) ||
            permittedAuthoritiesForWorkspace.has(Authority.WORKSPACE_ADMIN)
        )
        if (!hasRequiredAuthorityInternal) {
          throw new UnauthorizedException(
            `User with id ${userId} does not have any of the required authorities in the project with id ${entity.id}`
          )
        }
        break
      case ProjectAccessLevel.PRIVATE:
        const hasRequiredAuthorityPrivate = authorities.some(
          (auth) =>
            permittedAuthoritiesForProject.has(auth) ||
            permittedAuthoritiesForProject.has(Authority.WORKSPACE_ADMIN)
        )
        if (!hasRequiredAuthorityPrivate) {
          throw new UnauthorizedException(
            `User with id ${userId} does not have any of the required authorities in the project with id ${entity.id}`
          )
        }
        break
    }

    return project
  }

  public async checkAuthorityOverEnvironment(
    input: AuthorityInput
  ): Promise<EnvironmentWithProject> {
    const { userId, entity, authorities, prisma } = input

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

    const hasRequiredAuthority = authorities.some(
      (auth) =>
        permittedAuthorities.has(auth) ||
        permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    )

    if (!hasRequiredAuthority) {
      throw new UnauthorizedException(
        `User ${userId} does not have any of the required authorities`
      )
    }

    return environment
  }

  public async checkAuthorityOverVariable(
    input: AuthorityInput
  ): Promise<VariableWithProjectAndVersion> {
    const { userId, entity, authorities, prisma } = input

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

    const permittedAuthorities = await getCollectiveProjectAuthorities(
      userId,
      variable.project,
      prisma
    )

    const hasRequiredAuthority = authorities.some(
      (auth) =>
        permittedAuthorities.has(auth) ||
        permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    )

    if (!hasRequiredAuthority) {
      throw new UnauthorizedException(
        `User ${userId} does not have any of the required authorities`
      )
    }

    return variable
  }

  public async checkAuthorityOverSecret(
    input: AuthorityInput
  ): Promise<SecretWithProjectAndVersion> {
    const { userId, entity, authorities, prisma } = input

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

    const permittedAuthorities = await getCollectiveProjectAuthorities(
      userId,
      secret.project,
      prisma
    )

    const hasRequiredAuthority = authorities.some(
      (auth) =>
        permittedAuthorities.has(auth) ||
        permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    )

    if (!hasRequiredAuthority) {
      throw new UnauthorizedException(
        `User ${userId} does not have any of the required authorities`
      )
    }

    return secret
  }

  public async checkAuthorityOverIntegration(
    input: AuthorityInput
  ): Promise<Integration> {
    const { userId, entity, authorities, prisma } = input

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

    const permittedAuthorities = await getCollectiveWorkspaceAuthorities(
      integration.workspaceId,
      userId,
      prisma
    )

    const hasRequiredAuthority = authorities.some(
      (auth) =>
        permittedAuthorities.has(auth) ||
        permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    )

    if (!hasRequiredAuthority) {
      throw new UnauthorizedException(
        `User ${userId} does not have any of the required authorities`
      )
    }

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

      const hasRequiredProjectAuthority = authorities.some(
        (auth) =>
          projectAuthorities.has(auth) ||
          projectAuthorities.has(Authority.WORKSPACE_ADMIN)
      )

      if (!hasRequiredProjectAuthority) {
        throw new UnauthorizedException(
          `User ${userId} does not have any of the required authorities for the associated project`
        )
      }
    }

    return integration
  }
}
