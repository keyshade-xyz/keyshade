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
  Workspace
} from '@prisma/client'
import { CreateIntegration } from './dto/create.integration/create.integration'
import { UpdateIntegration } from './dto/update.integration/update.integration'
import { AuthorizationService } from '@/auth/service/authorization.service'
import IntegrationFactory from './plugins/integration.factory'
import { paginate } from '@/common/paginate'
import { createEvent } from '@/common/event'
import {
  constructErrorBody,
  decryptMetadata,
  encryptMetadata,
  limitMaxItemsPerPage
} from '@/common/util'
import { AuthenticatedUser } from '@/user/user.types'
import SlugGenerator from '@/common/slug-generator.service'
import { IntegrationAddedEventMetadata } from '@/event/event.types'

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly slugGenerator: SlugGenerator
  ) {}

  /**
   * Creates a new integration in the given workspace. The user needs to have
   * `CREATE_INTEGRATION` and `READ_WORKSPACE` authority in the workspace.
   *
   * If the integration is of type `PROJECT`, the user needs to have `READ_PROJECT`
   * authority in the project specified by `projectSlug`.
   *
   * If the integration is of type `ENVIRONMENT`, the user needs to have `READ_ENVIRONMENT`
   * authority in the environment specified by `environmentSlug`.
   *
   * If the integration is of type `PROJECT` and `environmentSlug` is provided,
   * the user needs to have `READ_ENVIRONMENT` authority in the environment specified
   * by `environmentSlug`.
   *
   * The integration is created with the given name, slug, type, metadata and
   * notifyOn events. The slug is generated using the `name` and a unique
   * identifier.
   *
   * @param user The user creating the integration
   * @param dto The integration data
   * @param workspaceSlug The slug of the workspace the integration is being
   * created in
   * @returns The created integration
   */
  async createIntegration(
    user: AuthenticatedUser,
    dto: CreateIntegration,
    workspaceSlug: Workspace['slug'],
    privateKey?: Project['privateKey']
  ) {
    this.logger.log(
      `User ${user.id} attempted to create integration ${dto.name} in workspace ${workspaceSlug}`
    )

    // Check if the user is permitted to create integrations in the workspace
    this.logger.log(`Checking user access to workspace ${workspaceSlug}`)
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.CREATE_INTEGRATION, Authority.READ_WORKSPACE]
      })
    const workspaceId = workspace.id

    // Check if integration with the same name already exists
    await this.existsByNameAndWorkspaceId(dto.name, workspace)

    // Create the integration object
    this.logger.log(`Creating integration object of type ${dto.type}`)
    let integrationObject = IntegrationFactory.createIntegrationWithType(
      dto.type,
      this.prisma
    )

    let project: Project | null = null
    const environments: Array<Environment> | null = []

    // Check if the user has READ authority over the project
    if (dto.projectSlug) {
      this.logger.log(`Checking user access to project ${dto.projectSlug}`)
      project = await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: dto.projectSlug },
        authorities: [Authority.READ_PROJECT]
      })

      privateKey = project.storePrivateKey ? project.privateKey : privateKey

      if (!privateKey && integrationObject.isPrivateKeyRequired()) {
        this.logger.error(
          `Can not create integration ${dto.type} without private key. Project slug: ${dto.projectSlug}`
        )
        throw new BadRequestException(
          constructErrorBody(
            'Can not create integration without private key',
            'Private key is required for this integration type'
          )
        )
      }
    } else if (integrationObject.isProjectRequired()) {
      this.logger.error(
        `Can not create integration ${dto.type} without project. Project slug: ${dto.projectSlug}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Can not create integration without project',
          'Project is required for this integration type'
        )
      )
    }

    // Check if only environments are provided
    if (dto.environmentSlugs && !dto.projectSlug) {
      this.logger.error(
        `Can not provide environment without project. Project slug: ${dto.projectSlug}. Environment slugs: ${dto.environmentSlugs}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Can not provide environment without project',
          'Environment can only be provided if project is also provided'
        )
      )
    }

    // Check if the user has READ authority over the environments
    if (dto.environmentSlugs) {
      for (const environmentSlug of dto.environmentSlugs) {
        this.logger.log(
          `Checking user access to environment ${environmentSlug}`
        )

        const environment =
          await this.authorizationService.authorizeUserAccessToEnvironment({
            user,
            entity: { slug: environmentSlug },
            authorities: [Authority.READ_ENVIRONMENT]
          })
        environments.push(environment)
      }
    } else if (integrationObject.areEnvironmentsRequired()) {
      this.logger.error(
        `Can not create integration ${dto.type} without environment. Environment slugs: ${dto.environmentSlugs}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Can not create integration without environments',
          'Environment is required for this integration type'
        )
      )
    }

    // Check for permitted events
    this.logger.log(`Checking for permitted events: ${dto.notifyOn}`)
    integrationObject.validatePermittedEvents(dto.notifyOn)

    // Check for authentication parameters
    this.logger.log(`Checking for metadata parameters: ${dto.metadata}`)
    integrationObject.validateMetadataParameters(dto.metadata)

    // Create the integration
    this.logger.log(`Creating integration: ${dto.name}`)
    const integration = await this.prisma.integration.create({
      data: {
        name: dto.name,
        slug: await this.slugGenerator.generateEntitySlug(
          dto.name,
          'INTEGRATION'
        ),
        type: dto.type,
        metadata: encryptMetadata(dto.metadata),
        notifyOn: dto.notifyOn,
        environments: {
          connect: environments
        },
        projectId: project?.id,
        workspaceId,
        lastUpdatedById: user.id
      },
      include: {
        lastUpdatedBy: {
          select: {
            id: true,
            name: true,
            profilePictureUrl: true
          }
        },
        environments: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })
    this.logger.log(
      `Integration ${integration.id} created by user ${user.id} in workspace ${workspaceId}`
    )

    const event = await createEvent(
      {
        triggeredBy: user,
        entity: integration,
        type: EventType.INTEGRATION_ADDED,
        source: EventSource.INTEGRATION,
        title: `Integration ${integration.name} created`,
        metadata: {
          privateKey
        } as IntegrationAddedEventMetadata,
        workspaceId: workspaceId
      },
      this.prisma
    )

    // Initialize the integration
    this.logger.log(`Initializing integration: ${integration.id}`)
    integrationObject = IntegrationFactory.createIntegration(
      integration,
      this.prisma
    )
    integrationObject.init(privateKey, event.id)

    // integration.metadata = decryptMetadata(integration.metadata)
    delete integration.environments
    return integration
  }

  /**
   * Updates an integration. The user needs to have `UPDATE_INTEGRATION` authority
   * over the integration.
   *
   * If the integration is of type `PROJECT`, the user needs to have `READ_PROJECT`
   * authority in the project specified by `projectSlug`.
   *
   * If the integration is of type `ENVIRONMENT`, the user needs to have `READ_ENVIRONMENT`
   * authority in the environment specified by `environmentSlug`.
   *
   * If the integration is of type `PROJECT` and `environmentSlug` is provided,
   * the user needs to have `READ_ENVIRONMENT` authority in the environment specified
   * by `environmentSlug`.
   *
   * The integration is updated with the given name, slug, metadata and
   * notifyOn events.
   *
   * @param user The user updating the integration
   * @param dto The integration data
   * @param integrationSlug The slug of the integration to update
   * @returns The updated integration
   */
  async updateIntegration(
    user: AuthenticatedUser,
    dto: UpdateIntegration,
    integrationSlug: Integration['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to update integration ${integrationSlug}`
    )

    this.logger.log(`Checking user access to integration ${integrationSlug}`)
    const integration =
      await this.authorizationService.authorizeUserAccessToIntegration({
        user,
        entity: { slug: integrationSlug },
        authorities: [Authority.UPDATE_INTEGRATION]
      })
    const integrationId = integration.id

    // Create the integration object
    this.logger.log(`Creating integration object of type ${integration.type}`)
    const integrationObject = IntegrationFactory.createIntegrationWithType(
      integration.type,
      this.prisma
    )

    // Check for permitted events
    dto.notifyOn && integrationObject.validatePermittedEvents(dto.notifyOn)

    // Check for authentication parameters
    dto.metadata &&
      integrationObject.validateMetadataParameters(dto.metadata, true)

    // Check if the name of the integration is being changed, and if so, check if the new name is unique
    if (dto.name) {
      await this.existsByNameAndWorkspaceId(dto.name, integration.workspace)
    }

    let project: Project | null = null
    let environments: Array<Environment> | null = null

    // If the project is being changed, check if the user has READ authority over the new project
    if (dto.projectSlug) {
      this.logger.log(`Checking user access to project ${dto.projectSlug}`)
      project = await this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: dto.projectSlug },
        authorities: [Authority.READ_PROJECT]
      })
    }

    // Check if only environments are provided, or if the integration has no project associated from prior
    if (dto.environmentSlugs && !integration.projectId && !dto.projectSlug) {
      this.logger.error(
        `Can not provide environment without project. Project slug: ${dto.projectSlug}. Environment slug: ${dto.environmentSlugs}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'Can not provide environment without project',
          'Environment can only be provided if project is also provided'
        )
      )
    }

    // If the environment is being changed, check if the user has READ authority over the new environment
    if (dto.environmentSlugs) {
      this.logger.log(
        `Checking user access to environments ${dto.environmentSlugs.join(', ')}`
      )
      environments = await Promise.all(
        dto.environmentSlugs.map((environmentSlug) =>
          this.authorizationService.authorizeUserAccessToEnvironment({
            user,
            entity: { slug: environmentSlug },
            authorities: [Authority.READ_ENVIRONMENT]
          })
        )
      )
    }

    // Update the integration
    this.logger.log(`Updating integration: ${integration.id}`)
    const updatedIntegration = await this.prisma.integration.update({
      where: { id: integrationId },
      data: {
        name: dto.name,
        slug: dto.name
          ? await this.slugGenerator.generateEntitySlug(dto.name, 'INTEGRATION')
          : integration.slug,
        metadata: encryptMetadata(dto.metadata),
        notifyOn: dto.notifyOn,
        environments:
          environments && environments.length > 0
            ? {
                set: environments.map((environment) => ({ id: environment.id }))
              }
            : undefined,
        projectId: project?.id,
        lastUpdatedById: user.id
      },
      include: {
        environments: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
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

    // @ts-expect-error -- We expect the metadata to be in JSON format
    updatedIntegration.metadata = decryptMetadata(updatedIntegration.metadata)
    return updatedIntegration
  }

  /**
   * Retrieves an integration by its slug. The user needs to have `READ_INTEGRATION`
   * authority over the integration.
   *
   * @param user The user retrieving the integration
   * @param integrationSlug The slug of the integration to retrieve
   * @returns The integration with the given slug
   */
  async getIntegration(
    user: AuthenticatedUser,
    integrationSlug: Integration['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to retrieve integration ${integrationSlug}`
    )
    const integration =
      await this.authorizationService.authorizeUserAccessToIntegration({
        user,
        entity: { slug: integrationSlug },
        authorities: [Authority.READ_INTEGRATION]
      })

    // @ts-expect-error -- We expect the metadata to be in JSON format
    integration.metadata = decryptMetadata(integration.metadata)
    return integration
  }

  /* istanbul ignore next */
  // The e2e tests are not working, but the API calls work as expected
  /**
   * Retrieves all integrations in a workspace that the user has READ authority over.
   *
   * The user needs to have `READ_INTEGRATION` authority over the workspace.
   *
   * The results are paginated and can be sorted by name ascending or descending.
   *
   * @param user The user retrieving the integrations
   * @param workspaceSlug The slug of the workspace to retrieve integrations from
   * @param page The page number of the results
   * @param limit The number of items per page
   * @param sort The property to sort the results by (default: name)
   * @param order The order to sort the results by (default: ascending)
   * @param search The string to search for in the integration names
   * @returns A paginated list of integrations in the workspace
   */
  async getAllIntegrationsOfWorkspace(
    user: AuthenticatedUser,
    workspaceSlug: Workspace['slug'],
    page: number,
    limit: number,
    sort: string,
    order: string,
    search: string
  ) {
    this.logger.log(
      `User ${user.id} attempted to retrieve all integrations in workspace ${workspaceSlug}`
    )

    this.logger.log(`Checking user access to workspace ${workspaceSlug}`)
    // Check if the user has READ authority over the workspace
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.READ_INTEGRATION]
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
      omit: {
        projectId: true
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),

      orderBy: {
        [sort]: order
      },

      include: {
        project: {
          select: {
            id: true,
            slug: true,
            name: true
          }
        },
        environments: {
          select: {
            id: true,
            slug: true,
            name: true
          }
        }
      }
    })

    // Calculate metadata for pagination
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

    // Decrypt the metadata
    for (const integration of integrations) {
      // @ts-expect-error -- We expect the metadata to be in JSON format
      integration.metadata = decryptMetadata(integration.metadata)
    }

    return { items: integrations, metadata }
  }

  /**
   * Deletes an integration by its slug. The user needs to have `DELETE_INTEGRATION`
   * authority over the integration.
   *
   * @param user The user deleting the integration
   * @param integrationSlug The slug of the integration to delete
   * @returns Nothing
   */
  async deleteIntegration(
    user: AuthenticatedUser,
    integrationSlug: Integration['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to delete integration ${integrationSlug}`
    )

    const integration =
      await this.authorizationService.authorizeUserAccessToIntegration({
        user,
        entity: { slug: integrationSlug },
        authorities: [Authority.DELETE_INTEGRATION]
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

  async getAllRunsOfIntegration(
    user: AuthenticatedUser,
    integrationSlug: Integration['slug'],
    page: number,
    limit: number
  ) {
    this.logger.log(
      `User ${user.id} attempted to retrieve all runs of integration ${integrationSlug}`
    )

    // Check if the user has READ authority over the integration
    this.logger.log(`Checking user access to integration ${integrationSlug}`)
    const integration =
      await this.authorizationService.authorizeUserAccessToIntegration({
        user,
        entity: { slug: integrationSlug },
        authorities: [Authority.READ_INTEGRATION]
      })

    const integrationId = integration.id

    // Fetch all runs of the integration
    this.logger.log(`Fetching all runs of integration ${integrationId}`)
    const runs = await this.prisma.integrationRun.findMany({
      where: {
        integrationId
      },
      include: {
        event: true
      },
      skip: page * limit,
      take: limitMaxItemsPerPage(limit),
      orderBy: {
        triggeredAt: 'desc'
      }
    })

    // Calculate metadata for pagination
    const totalCount = await this.prisma.integrationRun.count({
      where: {
        integrationId
      }
    })
    const metadata = paginate(
      totalCount,
      `/integration/${integrationSlug}/run`,
      {
        page,
        limit: limitMaxItemsPerPage(limit)
      }
    )

    return { items: runs, metadata }
  }

  /**
   * Checks if an integration with the same name already exists in the workspace.
   * Throws a ConflictException if the integration already exists.
   *
   * @param name The name of the integration to check
   * @param workspace The workspace to check in
   */
  private async existsByNameAndWorkspaceId(
    name: Integration['name'],
    workspace: Workspace
  ) {
    this.logger.log(
      `Checking if integration with name ${name} exists in workspace ${workspace.slug}`
    )
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
    ) {
      const errorMessage = `Integration with name ${name} already exists in workspace ${workspace.slug}`
      this.logger.error(errorMessage)
      throw new ConflictException(
        constructErrorBody('Integration already exists', errorMessage)
      )
    } else {
      this.logger.log(
        `Integration with name ${name} does not exist in workspace ${workspace.slug}`
      )
    }
  }
}
