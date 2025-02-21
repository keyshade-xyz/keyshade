import { UnauthorizedException, Injectable } from '@nestjs/common'
import { AuthorityCheckerService } from './authority-checker.service'
import { ProjectWithSecrets } from '@/project/project.types'
import { EnvironmentWithProject } from '@/environment/environment.types'
import { VariableWithProjectAndVersion } from '@/variable/variable.types'
import { SecretWithProjectAndVersion } from '@/secret/secret.types'
import { IntegrationWithWorkspace } from '@/integration/integration.types'
import { AuthorizationParams } from '../authorization.types'
import { AuthenticatedUser } from '@/user/user.types'
import { Workspace, User } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { CustomLoggerService } from '@/common/logger.service'
import { InternalServerErrorException, NotFoundException } from '@nestjs/common'

@Injectable()
export class AuthorizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService,
    private readonly customLoggerService: CustomLoggerService
  ) {}

  /**
   * Checks if the user is authorized to access the given workspace.
   * @param params The authorization parameters
   * @returns The workspace if the user is authorized to access it
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   * @throws ForbiddenException if the user is not authorized to access the workspace
   */
  public async authorizeUserAccessToWorkspace(
    params: AuthorizationParams
  ): Promise<Workspace> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace(params)

    this.checkUserHasAccessToWorkspace(params.user, workspace)

    return workspace
  }

  /**
   * Checks if the user is authorized to access the given project.
   * @param params The authorization parameters
   * @returns The project if the user is authorized to access it
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   * @throws ForbiddenException if the user is not authorized to access the project
   */
  public async authorizeUserAccessToProject(
    params: AuthorizationParams
  ): Promise<ProjectWithSecrets> {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject(params)

    const workspace = await this.getWorkspace(
      params.user.id,
      project.workspaceId
    )

    this.checkUserHasAccessToWorkspace(params.user, workspace)

    return project
  }

  /**
   * Checks if the user is authorized to access the given environment.
   * @param params The authorization parameters
   * @returns The environment if the user is authorized to access it
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   * @throws ForbiddenException if the user is not authorized to access the environment
   */
  public async authorizeUserAccessToEnvironment(
    params: AuthorizationParams
  ): Promise<EnvironmentWithProject> {
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment(params)

    const workspace = await this.getWorkspace(
      params.user.id,
      environment.project.workspaceId
    )

    this.checkUserHasAccessToWorkspace(params.user, workspace)

    return environment
  }

  /**
   * Checks if the user is authorized to access the given variable.
   * @param params The authorization parameters
   * @returns The variable if the user is authorized to access it
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   * @throws ForbiddenException if the user is not authorized to access the variable
   */
  public async authorizeUserAccessToVariable(
    params: AuthorizationParams
  ): Promise<VariableWithProjectAndVersion> {
    const variable =
      await this.authorityCheckerService.checkAuthorityOverVariable(params)

    const workspace = await this.getWorkspace(
      params.user.id,
      variable.project.workspaceId
    )

    this.checkUserHasAccessToWorkspace(params.user, workspace)

    return variable
  }

  /**
   * Checks if the user is authorized to access the given secret.
   * @param params The authorization parameters
   * @returns The secret if the user is authorized to access it
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   * @throws ForbiddenException if the user is not authorized to access the secret
   */
  public async authorizeUserAccessToSecret(
    params: AuthorizationParams
  ): Promise<SecretWithProjectAndVersion> {
    const secret =
      await this.authorityCheckerService.checkAuthorityOverSecret(params)

    const workspace = await this.getWorkspace(
      params.user.id,
      secret.project.workspaceId
    )

    this.checkUserHasAccessToWorkspace(params.user, workspace)

    return secret
  }

  /**
   * Checks if the user is authorized to access the given integration.
   * @param params The authorization parameters
   * @returns The integration if the user is authorized to access it
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   * @throws ForbiddenException if the user is not authorized to access the integration
   */
  public async authorizeUserAccessToIntegration(
    params: AuthorizationParams
  ): Promise<IntegrationWithWorkspace> {
    const integration =
      await this.authorityCheckerService.checkAuthorityOverIntegration(params)

    this.checkUserHasAccessToWorkspace(params.user, integration.workspace)

    return integration
  }

  /**
   * Fetches the requested workspace specified by userId and the filter.
   * @param userId The id of the user
   * @param filter The filter optionally including the workspace id, slug or name
   * @returns The requested workspace
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   */
  private async getWorkspace(
    userId: User['id'],
    workspaceId: Workspace['id']
  ): Promise<Workspace> {
    let workspace: Workspace

    try {
      workspace = await this.prisma.workspace.findUnique({
        where: {
          id: workspaceId
        }
      })
    } catch (error) {
      this.customLoggerService.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} not found`)
    }

    return workspace
  }

  private checkUserHasAccessToWorkspace(
    user: AuthenticatedUser,
    workspace: Workspace
  ) {
    if (
      workspace.blacklistedIpAddresses.some(
        (ipAddress) => ipAddress === user.ipAddress
      )
    ) {
      throw new UnauthorizedException(
        `User ${user.id} is not allowed to access this workspace`
      )
    }
  }
}
