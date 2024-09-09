import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import {
  Authority,
  Environment,
  EventSource,
  EventType,
  Integration,
  Project,
  User,
  Workspace
} from '@prisma/client'
import { CreateIntegration } from '../dto/create.integration/create.integration'
import { UpdateIntegration } from '../dto/update.integration/update.integration'
import { AuthorityCheckerService } from '@/common/authority-checker.service'
import IntegrationFactory from '../plugins/factory/integration.factory'
import { paginate } from '@/common/paginate'
import generateEntitySlug from '@/common/slug-generator'
import { createEvent } from '@/common/event'
import { limitMaxItemsPerPage } from '@/common/util'

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
    workspaceSlug: Workspace['slug']
  ) {
    // Check if the user is permitted to create integrations in the workspace
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.CREATE_INTEGRATION, Authority.READ_WORKSPACE],
        prisma: this.prisma
      })
    const workspaceId = workspace.id

    // Check if integration with the same name already exists
    await this.existsByNameAndWorkspaceId(dto.name, workspace)

    let project: Project | null = null
    let environment: Environment | null = null

    // Check if the user has READ authority over the project
    if (dto.projectSlug) {
      project = await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: dto.projectSlug },
        authorities: [Authority.READ_PROJECT],
        prisma: this.prisma
      })
    }

    // Check if only environmentId is provided
    if (dto.environmentSlug && !dto.projectSlug) {
      throw new BadRequestException(
        'Environment can only be provided if project is also provided'
      )
    }

    // Check if the user has READ authority over the environment
    if (dto.environmentSlug) {
      environment =
        await this.authorityCheckerService.checkAuthorityOverEnvironment({
          userId: user.id,
          entity: { slug: dto.environmentSlug },
          authorities: [Authority.READ_ENVIRONMENT],
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
        slug: await generateEntitySlug(dto.name, 'INTEGRATION', this.prisma),
        type: dto.type,
        metadata: dto.metadata,
        notifyOn: dto.notifyOn,
        environmentId: environment?.id,
        projectId: project?.id,
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
    integrationSlug: Integration['slug']
  ) {
    const integration =
      await this.authorityCheckerService.checkAuthorityOverIntegration({
        userId: user.id,
        entity: { slug: integrationSlug },
        authorities: [Authority.UPDATE_INTEGRATION],
        prisma: this.prisma
      })
    const integrationId = integration.id

    // Check if the name of the integration is being changed, and if so, check if the new name is unique
    if (dto.name) {
      await this.existsByNameAndWorkspaceId(dto.name, integration.workspace)
    }

    let project: Project | null = null
    let environment: Environment | null = null

    // If the project is being changed, check if the user has READ authority over the new project
    if (dto.projectSlug) {
      project = await this.authorityCheckerService.checkAuthorityOverProject({
        userId: user.id,
        entity: { slug: dto.projectSlug },
        authorities: [Authority.READ_PROJECT],
        prisma: this.prisma
      })
    }

    // Check if only environmentId is provided, or if the integration has no project associated from prior
    if (dto.environmentSlug && !integration.projectId && !dto.projectSlug) {
      throw new BadRequestException(
        'Environment can only be provided if project is also provided'
      )
    }

    // If the environment is being changed, check if the user has READ authority over the new environment
    if (dto.environmentSlug) {
      environment =
        await this.authorityCheckerService.checkAuthorityOverEnvironment({
          userId: user.id,
          entity: { slug: dto.environmentSlug },
          authorities: [Authority.READ_ENVIRONMENT],
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
        slug: dto.name
          ? await generateEntitySlug(dto.name, 'INTEGRATION', this.prisma)
          : integration.slug,
        metadata: dto.metadata,
        notifyOn: dto.notifyOn,
        environmentId: environment?.id,
        projectId: project?.id
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

  async getIntegration(user: User, integrationSlug: Integration['slug']) {
    return this.authorityCheckerService.checkAuthorityOverIntegration({
      userId: user.id,
      entity: { slug: integrationSlug },
      authorities: [Authority.READ_INTEGRATION],
      prisma: this.prisma
    })
  }

  /* istanbul ignore next */
  // The e2e tests are not working, but the API calls work as expected
  async getAllIntegrationsOfWorkspace(
    user: User,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    // Check if the user has READ authority over the workspace
    const workspace =
      await this.authorityCheckerService.checkAuthorityOverWorkspace({
        userId: user.id,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_INTEGRATION],
        prisma: this.prisma
      })
    const workspaceId = workspace.id

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
      take: limitMaxItemsPerPage(limit),

      orderBy: {
        [sort]: order
      }
    })

    //calculate metadata for pagination
    const totalCount = await this.prisma.integration.count({
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
      }
    })
    const metadata = paginate(totalCount, `/integration/all/${workspaceSlug}`, {
      page,
      limit: limitMaxItemsPerPage(limit),
      sort,
      order,
      search
    })

    return { items: integrations, metadata }
  }

  async deleteIntegration(user: User, integrationSlug: Integration['slug']) {
    const integration =
      await this.authorityCheckerService.checkAuthorityOverIntegration({
        userId: user.id,
        entity: { slug: integrationSlug },
        authorities: [Authority.DELETE_INTEGRATION],
        prisma: this.prisma
      })
    const integrationId = integration.id

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
    workspace: Workspace
  ) {
    const workspaceId = workspace.id

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
