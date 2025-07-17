import { UnauthorizedException, Injectable, Logger } from '@nestjs/common'
import { AuthorityCheckerService } from './authority-checker.service'
import { ProjectWithSecrets } from '@/project/project.types'
import { HydratedEnvironment } from '@/environment/environment.types'
import { RawEntitledVariable } from '@/variable/variable.types'
import { RawEntitledSecret } from '@/secret/secret.types'
import { HydratedIntegration } from '@/integration/integration.types'
import { AuthenticatedUser } from '@/user/user.types'
import { Workspace } from '@prisma/client'
import { PrismaService } from '@/prisma/prisma.service'
import { InternalServerErrorException, NotFoundException } from '@nestjs/common'
import { AuthorizationParams } from '../auth.types'
import { WorkspaceWithLastUpdatedByAndOwner } from '@/workspace/workspace.types'

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
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
  ): Promise<WorkspaceWithLastUpdatedByAndOwner> {
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

    const workspace = await this.getWorkspace(project.workspaceId)

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
  ): Promise<HydratedEnvironment> {
    const environment =
      await this.authorityCheckerService.checkAuthorityOverEnvironment(params)

    const workspace = await this.getWorkspace(environment.project.workspaceId)

    this.checkUserHasAccessToWorkspace(params.user, workspace)
    delete environment.project

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
  ): Promise<RawEntitledVariable> {
    const variable =
      await this.authorityCheckerService.checkAuthorityOverVariable(params)

    const workspace = await this.getWorkspace(variable.project.workspaceId)

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
  ): Promise<RawEntitledSecret> {
    const secret =
      await this.authorityCheckerService.checkAuthorityOverSecret(params)

    const workspace = await this.getWorkspace(secret.project.workspaceId)

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
  ): Promise<HydratedIntegration> {
    const integration =
      await this.authorityCheckerService.checkAuthorityOverIntegration(params)

    this.checkUserHasAccessToWorkspace(params.user, integration.workspace)
    delete integration.workspace

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
  private async getWorkspace(workspaceId: Workspace['id']): Promise<Workspace> {
    let workspace: Workspace

    this.logger.log(`Fetching workspace ${workspaceId}`)
    try {
      workspace = await this.prisma.workspace.findUnique({
        where: {
          id: workspaceId
        }
      })
    } catch (error) {
      this.logger.error(error)
      throw new InternalServerErrorException(error)
    }

    if (!workspace) {
      const errorMessage = `Workspace ${workspaceId} not found`
      this.logger.error(errorMessage)
      throw new NotFoundException(errorMessage)
    }

    return workspace
  }

  private checkUserHasAccessToWorkspace(
    user: AuthenticatedUser,
    workspace: Workspace
  ) {
    this.logger.log(
      `Checking if user ${user.id}'s IP address has access to workspace ${workspace.id}`
    )
    if (
      workspace.blacklistedIpAddresses.some(
        (ipAddress) => ipAddress === user.ipAddress
      )
    ) {
      this.logger.error(
        `User ${user.id}'s IP address is blacklisted from accessing workspace ${workspace.id}`
      )
      throw new UnauthorizedException(
        `User ${user.id} is not allowed to access this workspace`
      )
    }
  }
}
