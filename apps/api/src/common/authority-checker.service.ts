import { PrismaClient, Authority, Workspace } from '@prisma/client'
import { VariableWithProjectAndVersion } from '../variable/variable.types'
import {
  BadRequestException,
  Injectable,
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
  entity: {
    id?: string
    name?: string
  }
  authority: Authority
  prisma: PrismaClient
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
      if (entity?.id) {
        workspace = await prisma.workspace.findUnique({
          where: {
            id: entity.id
          }
        })
      } else {
        workspace = await prisma.workspace.findFirst({
          where: {
            name: entity?.name,
            members: { some: { userId: userId } }
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new Error(error)
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
      if (entity?.id) {
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
            name: entity?.name,
            workspace: { members: { some: { userId: userId } } }
          },
          include: {
            secrets: true
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new Error(error)
    }

    // If the project is not found, throw an error
    if (!project) {
      throw new NotFoundException(`Project with id ${entity?.id} not found`)
    }

    // Get the authorities of the user in the workspace with the project
    const permittedAuthorities = await getCollectiveProjectAuthorities(
      userId,
      project,
      prisma
    )

    // If the user does not have the required authority, or is not a workspace admin, throw an error
    if (
      !permittedAuthorities.has(authority) &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN)
    ) {
      throw new UnauthorizedException(
        `User with id ${userId} does not have the authority in the project with id ${entity?.id}`
      )
    }

    // If the project is pending creation, only the user who created the project, a workspace admin or
    // a user with the MANAGE_APPROVALS authority can fetch the project
    if (
      project.pendingCreation &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN) &&
      !permittedAuthorities.has(Authority.MANAGE_APPROVALS) &&
      project.lastUpdatedById !== userId
    ) {
      throw new BadRequestException(
        `The project with id ${entity?.id} is pending creation and cannot be fetched by the user with id ${userId}`
      )
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
      if (entity?.id) {
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
            name: entity?.name,
            project: { workspace: { members: { some: { userId: userId } } } }
          },
          include: {
            project: true
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new Error(error)
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

    // If the environment is pending creation, only the user who created the environment, a workspace admin or
    // a user with the MANAGE_APPROVALS authority can fetch the environment
    if (
      environment.pendingCreation &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN) &&
      !permittedAuthorities.has(Authority.MANAGE_APPROVALS) &&
      environment.lastUpdatedById !== userId
    ) {
      throw new BadRequestException(
        `The environment with id ${entity.id} is pending creation and cannot be fetched by the user with id ${userId}`
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
      if (entity?.id) {
        variable = await prisma.variable.findUnique({
          where: {
            id: entity.id
          },
          include: {
            versions: true,
            project: true,
            environment: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      } else {
        variable = await prisma.variable.findFirst({
          where: {
            name: entity?.name,
            environment: {
              project: { workspace: { members: { some: { userId: userId } } } }
            }
          },
          include: {
            versions: true,
            project: true,
            environment: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new Error(error)
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

    // If the variable is pending creation, only the user who created the variable, a workspace admin or
    // a user with the MANAGE_APPROVALS authority can fetch the variable
    if (
      variable.pendingCreation &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN) &&
      !permittedAuthorities.has(Authority.MANAGE_APPROVALS) &&
      variable.lastUpdatedById !== userId
    ) {
      throw new BadRequestException(
        `The variable with id ${entity.id} is pending creation and cannot be fetched by the user with id ${userId}`
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
      if (entity?.id) {
        secret = await prisma.secret.findUnique({
          where: {
            id: entity.id
          },
          include: {
            versions: true,
            project: true,
            environment: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      } else {
        secret = await prisma.secret.findFirst({
          where: {
            name: entity?.name,
            environment: {
              project: { workspace: { members: { some: { userId: userId } } } }
            }
          },
          include: {
            versions: true,
            project: true,
            environment: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      }
    } catch (error) {
      this.customLoggerService.error(error)
      throw new Error(error)
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

    // If the secret is pending creation, only the user who created the secret, a workspace admin or
    // a user with the MANAGE_APPROVALS authority can fetch the secret
    if (
      secret.pendingCreation &&
      !permittedAuthorities.has(Authority.WORKSPACE_ADMIN) &&
      !permittedAuthorities.has(Authority.MANAGE_APPROVALS) &&
      secret.lastUpdatedById !== userId
    ) {
      throw new BadRequestException(
        `The secret with id ${entity.id} is pending creation and cannot be fetched by the user with id ${userId}`
      )
    }

    return secret
  }
}
