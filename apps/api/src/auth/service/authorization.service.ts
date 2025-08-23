import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException
} from '@nestjs/common'
import { AuthorityCheckerService } from './authority-checker.service'
import { HydratedProject } from '@/project/project.types'
import { HydratedEnvironment } from '@/environment/environment.types'
import { HydratedIntegration } from '@/integration/integration.types'
import { AuthenticatedUser } from '@/user/user.types'
import { Workspace } from '@prisma/client'
import { AuthorizationParams } from '../auth.types'
import { HydratedWorkspaceRole } from '@/workspace-role/workspace-role.types'
import { HydratedVariable } from '@/variable/variable.types'
import { HydratedSecret } from '@/secret/secret.types'
import { HydratedWorkspace } from '@/workspace/workspace.types'
import { PrismaService } from '@/prisma/prisma.service'

@Injectable()
export class AuthorizationService {
  private readonly logger = new Logger(AuthorizationService.name)

  constructor(
    private readonly authorityCheckerService: AuthorityCheckerService,
    private readonly prisma: PrismaService
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
  ): Promise<HydratedWorkspace> {
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace(
        params,
        this
      )

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
  ): Promise<HydratedProject> {
    const project =
      await this.authorityCheckerService.checkAuthorityOverProject(params, this)

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
  ): Promise<HydratedVariable> {
    const variable =
      await this.authorityCheckerService.checkAuthorityOverVariable(
        params,
        this
      )

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
  ): Promise<HydratedSecret> {
    const secret = await this.authorityCheckerService.checkAuthorityOverSecret(
      params,
      this
    )

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
   * Checks if the user is authorized to access the given workspace role.
   * @param params The authorization parameters
   * @returns The workspace role if the user is authorized to access it
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace role is not found
   * @throws UnauthorizedException if the user does not have the required authorities
   * @throws ForbiddenException if the user is not authorized to access the workspace role
   */
  public async authorizeUserAccessToWorkspaceRole(
    params: AuthorizationParams
  ): Promise<HydratedWorkspaceRole> {
    const workspaceRole =
      await this.authorityCheckerService.checkAuthorityOverWorkspaceRole(params)

    this.checkUserHasAccessToWorkspace(params.user, workspaceRole.workspace)
    delete workspaceRole.workspace

    return workspaceRole
  }

  /**
   * Fetches the requested workspace specified by userId and the filter.
   * @returns The requested workspace
   * @throws InternalServerErrorException if there's an error when communicating with the database
   * @throws NotFoundException if the workspace is not found
   * @param workspaceId
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
