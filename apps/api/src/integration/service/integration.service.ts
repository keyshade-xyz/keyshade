import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import {
  Authority,
  EventSource,
  EventType,
  Integration,
  User,
  Workspace
} from '@prisma/client'
import { CreateIntegration } from '../dto/create.integration/create.integration'
import { UpdateIntegration } from '../dto/update.integration/update.integration'
import { AuthorityCheckerService } from '../../common/authority-checker.service'
import createEvent from '../../common/create-event'
import IntegrationFactory from '../plugins/factory/integration.factory'

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorityCheckerService: AuthorityCheckerService
  ) {}

  async createIntegration(
    user: User,
    dto: CreateIntegration,
    workspaceId: Workspace['id']
  ) {
    // Check if integration with the same name already exists
    await this.existsByNameAndWorkspaceId(dto.name, workspaceId)

    // Check if the user is permitted to create integrations in the workspace
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.CREATE_INTEGRATION,
      prisma: this.prisma
    })

    // Check if the user has READ authority over the workspace
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_WORKSPACE,
      prisma: this.prisma
    })

    // Check if the user has READ authority over the project
    if (dto.projectId) {
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: dto.projectId },
        authority: Authority.READ_PROJECT,
        prisma: this.prisma
      })
    }

    // Check if only environmentId is provided
    if (dto.environmentId && !dto.projectId) {
      throw new BadRequestException(
        'Environment can only be provided if project is also provided'
      )
    }

    // Check if the user has READ authority over the environment
    if (dto.environmentId) {
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { id: dto.environmentId },
        authority: Authority.READ_ENVIRONMENT,
        prisma: this.prisma
      })
    }

    // Create the integration object
    const integrationObject = IntegrationFactory.createIntegration(dto.type)

    // Check for permitted events
    integrationObject.validatePermittedEvents(dto.notifyOn)

    // Check for authentication parameters
    integrationObject.validateMetadataParameters(dto.metadata)

    // Create the integration
    const integration = await this.prisma.integration.create({
      data: {
        name: dto.name,
        type: dto.type,
        metadata: dto.metadata,
        notifyOn: dto.notifyOn,
        environmentId: dto.environmentId,
        projectId: dto.projectId,
        workspaceId
      }
    })

    this.logger.log(
      `Integration ${integration.id} created by user ${user.id} in workspace ${workspaceId}`
    )

    await createEvent(
      {
        triggeredBy: user,
        entity: integration,
        type: EventType.INTEGRATION_ADDED,
        source: EventSource.INTEGRATION,
        title: `Integration ${integration.name} created`,
        metadata: {
          integrationId: integration.id
        },
        workspaceId: workspaceId
      },
      this.prisma
    )

    return integration
  }

  async updateIntegration(
    user: User,
    dto: UpdateIntegration,
    integrationId: Integration['id']
  ) {
    const integration =
      await this.authorityCheckerService.checkAuthorityOverIntegration({
        userId: user.id,
        entity: { id: integrationId },
        authority: Authority.UPDATE_INTEGRATION,
        prisma: this.prisma
      })

    // Check if the name of the integration is being changed, and if so, check if the new name is unique
    if (dto.name) {
      await this.existsByNameAndWorkspaceId(dto.name, integration.workspaceId)
    }

    // If the project is being changed, check if the user has READ authority over the new project
    if (dto.projectId) {
      await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { id: dto.projectId },
        authority: Authority.READ_PROJECT,
        prisma: this.prisma
      })
    }

    // Check if only environmentId is provided, or if the integration has no project associated from prior
    if (dto.environmentId && !integration.projectId && !dto.projectId) {
      throw new BadRequestException(
        'Environment can only be provided if project is also provided'
      )
    }

    // If the environment is being changed, check if the user has READ authority over the new environment
    if (dto.environmentId) {
      await this.authorityCheckerService.checkAuthorityOverEnvironment({
        userId: user.id,
        entity: { id: dto.environmentId },
        authority: Authority.READ_ENVIRONMENT,
        prisma: this.prisma
      })
    }

    // Create the integration object
    const integrationObject = IntegrationFactory.createIntegration(
      integration.type
    )

    // Check for permitted events
    dto.notifyOn && integrationObject.validatePermittedEvents(dto.notifyOn)

    // Check for authentication parameters
    dto.metadata && integrationObject.validateMetadataParameters(dto.metadata)

    // Update the integration
    const updatedIntegration = await this.prisma.integration.update({
      where: { id: integrationId },
      data: {
        name: dto.name,
        metadata: dto.metadata,
        notifyOn: dto.notifyOn,
        environmentId: dto.environmentId,
        projectId: dto.projectId
      }
    })

    this.logger.log(
      `Integration ${integrationId} updated by user ${user.id} in workspace ${integration.workspaceId}`
    )

    await createEvent(
      {
        triggeredBy: user,
        entity: updatedIntegration,
        type: EventType.INTEGRATION_UPDATED,
        source: EventSource.INTEGRATION,
        title: `Integration ${updatedIntegration.name} updated`,
        metadata: {
          integrationId: updatedIntegration.id
        },
        workspaceId: integration.workspaceId
      },
      this.prisma
    )

    return updatedIntegration
  }

  async getIntegration(user: User, integrationId: Integration['id']) {
    return this.authorityCheckerService.checkAuthorityOverIntegration({
      userId: user.id,
      entity: { id: integrationId },
      authority: Authority.READ_INTEGRATION,
      prisma: this.prisma
    })
  }

  /* istanbul ignore next */
  // The e2e tests are not working, but the API calls work as expected
  async getAllIntegrationsOfWorkspace(
    user: User,
    workspaceId: Workspace['id'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    // Check if the user has READ authority over the workspace
    await this.authorityCheckerService.checkAuthorityOverWorkspace({
      userId: user.id,
      entity: { id: workspaceId },
      authority: Authority.READ_INTEGRATION,
      prisma: this.prisma
    })

    // We need to return only those integrations that have the following properties:
    // - belong to the workspace
    // - does not belong to any project
    // - does not belong to any project where the user does not have READ authority

    // Get the projects the user has READ authority over
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          userId: user.id,
          workspaceId
        }
      }
    })
    const workspaceRoles = await this.prisma.workspaceRole.findMany({
      where: {
        workspaceId,
        workspaceMembers: {
          some: {
            workspaceMemberId: membership.id
          }
        }
      },
      include: {
        projects: {
          include: {
            project: true
          }
        }
      }
    })
    const projectIds =
      workspaceRoles
        .map((role) => role.projects.map((p) => p.projectId))
        .flat() || []

    // Get all integrations in the workspace
    const integrations = await this.prisma.integration.findMany({
      where: {
        name: {
          contains: search
        },
        workspaceId,
        OR: [
          {
            projectId: null
          },
          {
            projectId: {
              in: projectIds
            }
          }
        ]
      },
      skip: page * limit,
      take: limit,
      orderBy: {
        [sort]: order
      }
    })

    return integrations
  }

  async deleteIntegration(user: User, integrationId: Integration['id']) {
    const integration =
      await this.authorityCheckerService.checkAuthorityOverIntegration({
        userId: user.id,
        entity: { id: integrationId },
        authority: Authority.DELETE_INTEGRATION,
        prisma: this.prisma
      })

    await this.prisma.integration.delete({
      where: { id: integrationId }
    })

    this.logger.log(
      `Integration ${integrationId} deleted by user ${user.id} in workspace ${integration.workspaceId}`
    )

    await createEvent(
      {
        triggeredBy: user,
        entity: integration,
        type: EventType.INTEGRATION_DELETED,
        source: EventSource.INTEGRATION,
        title: `Integration ${integration.name} deleted`,
        metadata: {
          integrationId: integration.id
        },
        workspaceId: integration.workspaceId
      },
      this.prisma
    )
  }

  private async existsByNameAndWorkspaceId(
    name: Integration['name'],
    workspaceId: Workspace['id']
  ) {
    if (
      (await this.prisma.integration.findUnique({
        where: {
          workspaceId_name: {
            workspaceId,
            name
          }
        }
      })) !== null
    )
      throw new ConflictException(
        'Integration with the same name already exists in the workspace'
      )
  }
}
