import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException
} from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import {
  Authority,
  Environment,
  EventSource,
  EventType,
  Integration,
  IntegrationType,
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
import { BaseIntegration } from './plugins/base.integration'

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
   * Check `validateIntegrationCreation` for more details regarding validation.
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
    workspaceSlug: Workspace['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to create integration ${dto.name} in workspace ${workspaceSlug}`
    )

    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        entity: { slug: workspaceSlug },
        authorities: [Authority.CREATE_INTEGRATION, Authority.READ_WORKSPACE]
      })
    const workspaceId = workspace.id

    await this.existsByNameAndWorkspaceId(dto.name, workspace)

    let integrationObject = IntegrationFactory.createIntegrationWithType(
      dto.type,
      this.prisma
    )

    const { project, privateKey, environments } =
      await this.validateIntegrationConfiguration(
        user,
        dto,
        integrationObject,
        true
      )

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
          integration: {
            id: integration.id,
            name: integration.name,
            type: integration.type
          }
        },
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

    if (dto.name) {
      await this.existsByNameAndWorkspaceId(dto.name, integration.workspace)
    }

    // Create the integration object
    this.logger.log(`Creating integration object of type ${integration.type}`)
    const integrationObject = IntegrationFactory.createIntegrationWithType(
      integration.type,
      this.prisma
    )

    const { environments } = await this.validateIntegrationConfiguration(
      user,
      dto,
      integrationObject,
      false,
      integration
    )

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

  /**
   * Validates the environment support for an integration based on its type and environment slugs.
   * Throws a BadRequestException if the required environment conditions are not met.
   *
   * @param integrationObject The integration object to validate.
   * @param type The type of the integration.
   * @param environmentSlugs Optional array of environment slugs associated with the integration.
   */

  private validateEnvironmentSupport(
    integrationObject: BaseIntegration,
    type: IntegrationType,
    environmentSlugs?: Environment['slug'][]
  ) {
    this.logger.log(
      `Environment support is ${integrationObject.environmentSupport()} for integration type ${type}. Supplied enviornment slugs: ${environmentSlugs}`
    )

    // Validate environment requirement
    switch (integrationObject.environmentSupport()) {
      case 'atleast-one':
        if (!environmentSlugs || environmentSlugs.length < 1) {
          this.logger.error(
            `Can not create integration ${type} without environment.`
          )
          throw new BadRequestException(
            constructErrorBody(
              'Can not create integration without environment',
              'Environment is required for this integration type'
            )
          )
        }
        break
      case 'single':
        if (!environmentSlugs || environmentSlugs.length !== 1) {
          this.logger.error(
            `Can not create integration ${type} with multiple environments.`
          )
          throw new BadRequestException(
            constructErrorBody(
              'Can not create integration with multiple environments',
              'Single environment is required for this integration type'
            )
          )
        }
        break
    }
  }

  /**
   * Tests a new integration in the given workspace. The user needs to have
   * `CREATE_INTEGRATION` and `READ_WORKSPACE` authority in the workspace.
   * Validate only metadata and event subscriptions for an integration.
   *
   * This method skips project and environment resolution entirely, focusing on
   * permitted events, metadata parameter validation and live configuration tests.
   *
   * @param user - The authenticated user performing metadata validation.
   * @param dto - CreateIntegration or UpdateIntegration DTO containing optional
   *   notifyOn and metadata fields.
   * @param isCreate - True if validating for a new integration; false for update.
   * @param integrationSlug - Slug of the existing integration (required when isCreate is false).
   * @returns A promise resolving to { success: true } upon successful validation.
   * @throws BadRequestException if integrationSlug is missing when updating.
   * @throws UnauthorizedException if the user is not authorized to update the integration.
   * @throws BadRequestException if event subscriptions or metadata parameters are invalid.
   * @throws BadRequestException if live configuration testing via validateConfiguration fails.
   */
  async validateIntegrationMetadata(
    user: AuthenticatedUser,
    dto: CreateIntegration | UpdateIntegration,
    isCreate: boolean,
    integrationSlug?: Integration['slug']
  ): Promise<{ success: true }> {
    this.logger.log(
      `User ${user.id} is metadata‐validating integration ${dto.name} ` +
        (isCreate ? `(new)` : `(existing ${integrationSlug})`)
    )

    let integrationObject: BaseIntegration
    if (isCreate) {
      integrationObject = IntegrationFactory.createIntegrationWithType(
        (dto as CreateIntegration).type,
        this.prisma
      )
    } else {
      if (!integrationSlug) {
        throw new BadRequestException(
          constructErrorBody(
            'Missing integrationSlug on update test',
            'integrationSlug is required for update‐validation'
          )
        )
      }
      const existing =
        await this.authorizationService.authorizeUserAccessToIntegration({
          user,
          entity: { slug: integrationSlug },
          authorities: [Authority.UPDATE_INTEGRATION]
        })
      integrationObject = IntegrationFactory.createIntegrationWithType(
        existing.type,
        this.prisma
      )
    }

    await this.validateEventsAndMetadataParams(dto, integrationObject, isCreate)

    return { success: true }
  }

  /**
   * Validate integration configuration for create or update.
   *
   * This method orchestrates project resolution, private key resolution (on creation),
   * environment resolution, and event/metadata parameter validation.
   *
   * @param user - The authenticated user performing the operation.
   * @param dto - Data transfer object for creating or updating an integration.
   * @param integrationObject - Instance of BaseIntegration for this integration type.
   * @param isCreate - True if this is a create operation, false for update.
   * @param existingIntegration - The existing Integration entity (only for updates).
   * @returns An object containing:
   *   - project: The authorized Project or null.
   *   - privateKey: The resolved private key or null.
   *   - environments: Array of authorized Environment entities.
   */
  private async validateIntegrationConfiguration(
    user: AuthenticatedUser,
    dto: CreateIntegration | UpdateIntegration,
    integrationObject: BaseIntegration,
    isCreate: boolean,
    existingIntegration?: Integration
  ): Promise<{
    project: Project | null
    privateKey: string | null
    environments: Environment[]
  }> {
    const project = await this.resolveProject(
      user,
      dto,
      integrationObject,
      isCreate,
      existingIntegration
    )
    const privateKey = isCreate
      ? this.resolvePrivateKey(
          dto as CreateIntegration,
          integrationObject,
          project
        )
      : null

    const environments = await this.resolveEnvironments(
      user,
      dto,
      isCreate,
      integrationObject,
      project
    )

    await this.validateEventsAndMetadataParams(dto, integrationObject, isCreate)

    return { project, privateKey, environments }
  }

  /**
   * Resolve and authorize the project for an integration.
   *
   * On creation, requires dto.projectSlug. On update, uses existingIntegration.projectId.
   * Throws if a project is required but missing.
   *
   * @param user - The authenticated user.
   * @param dto - DTO for integration.
   * @param integrationObject - Instance of BaseIntegration.
   * @param isCreate - True for create operations, false for update.
   * @param existing - Existing Integration entity (for update scenarios).
   * @returns The authorized Project entity or null if none.
   * @throws BadRequestException if project is required but not provided.
   * @throws NotFoundException if the existing project cannot be found.
   */
  private async resolveProject(
    user: AuthenticatedUser,
    dto: CreateIntegration | UpdateIntegration,
    integrationObject: BaseIntegration,
    isCreate: boolean,
    existing?: Integration
  ): Promise<Project | null> {
    if ('projectSlug' in dto && dto.projectSlug) {
      this.logger.log(`Checking user access to project ${dto.projectSlug}`)
      return this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: dto.projectSlug },
        authorities: [Authority.READ_PROJECT]
      })
    }

    if (!isCreate && existing?.projectId) {
      this.logger.log(`Using existing project ${existing.projectId} on update`)
      const proj = await this.prisma.project.findUnique({
        where: { id: existing.projectId }
      })
      if (!proj) {
        throw new NotFoundException(
          constructErrorBody(
            'Project not found',
            `Project ${existing.projectId} not found`
          )
        )
      }
      return this.authorizationService.authorizeUserAccessToProject({
        user,
        entity: { slug: proj.slug },
        authorities: [Authority.READ_PROJECT]
      })
    }

    if (isCreate && integrationObject.isProjectRequired()) {
      throw new BadRequestException(
        constructErrorBody(
          'Project required',
          'You must specify a project for this integration type'
        )
      )
    }

    return null
  }

  /**
   * Determine the private key to use when creating an integration.
   *
   * Uses the project's stored private key if configured; otherwise falls back
   * to dto.privateKey. Throws if a key is required but none is provided.
   *
   * @param dto - CreateIntegration DTO containing an optional privateKey.
   * @param integrationObject - Instance of BaseIntegration for this type.
   * @param project - The resolved Project or null.
   * @returns The chosen private key string, or null if none.
   * @throws BadRequestException if a private key is required but missing.
   */
  private resolvePrivateKey(
    dto: CreateIntegration,
    integrationObject: BaseIntegration,
    project: Project | null
  ): string | null {
    const candidate =
      project?.storePrivateKey && project.privateKey
        ? project.privateKey
        : dto.privateKey

    if (!candidate && integrationObject.isPrivateKeyRequired()) {
      throw new BadRequestException(
        constructErrorBody(
          'Private key required',
          'This integration type needs a private key'
        )
      )
    }
    return candidate ?? null
  }

  /**
   * Resolve and authorize environments for an integration.
   *
   * Validates each slug via the authorization service. Throws if environments
   * are required but none are provided, or if a project context is missing.
   *
   * @param user - The authenticated user.
   * @param dto - Integration DTO with optional environmentSlugs.
   * @param isCreate - True for create, false for update.
   * @param integrationObject - Instance of BaseIntegration.
   * @param project - The resolved Project or null.
   * @returns Array of authorized Environment entities (possibly empty).
   * @throws BadRequestException if no project when slugs provided or if environments
   *   are required on creation but none given.
   */
  private async resolveEnvironments(
    user: AuthenticatedUser,
    dto: CreateIntegration | UpdateIntegration,
    isCreate: boolean,
    integrationObject: BaseIntegration,
    project: Project | null
  ): Promise<Environment[]> {
    const slugs = 'environmentSlugs' in dto ? (dto.environmentSlugs ?? []) : []
    if (slugs.length) {
      if (!project) {
        throw new BadRequestException(
          constructErrorBody(
            'Environment without project',
            'You need a project before assigning environments'
          )
        )
      }
      return Promise.all(
        slugs.map((slug) => {
          this.logger.log(`Checking access to environment ${slug}`)
          return this.authorizationService.authorizeUserAccessToEnvironment({
            user,
            entity: { slug },
            authorities: [Authority.READ_ENVIRONMENT]
          })
        })
      )
    }

    if (isCreate && integrationObject.areEnvironmentsRequired()) {
      throw new BadRequestException(
        constructErrorBody(
          'Environments required',
          'This integration type needs at least one environment'
        )
      )
    }
    return []
  }

  /**
   * Validate metadata parameters, permitted events and live configuration testing.
   *
   * @param dto - CreateIntegration or UpdateIntegration DTO.
   * @param integration - The BaseIntegration instance responsible for validation logic.
   * @param isUpdate - True if this invocation is part of a create operation;
   *   false if part of update.
   * @returns A promise that resolves when all validations complete.
   * @throws BadRequestException if event subscriptions or metadata parameters are invalid.
   * @throws BadRequestException if live configuration testing via validateConfiguration fails.
   */
  private async validateEventsAndMetadataParams(
    dto: CreateIntegration | UpdateIntegration,
    integration: BaseIntegration,
    isCreate: boolean
  ): Promise<void> {
    if ('notifyOn' in dto && dto.notifyOn) {
      this.logger.log(`Checking for permitted events: ${dto.notifyOn}`)
      integration.validatePermittedEvents(dto.notifyOn)
    }

    if ('metadata' in dto && dto.metadata) {
      this.logger.log(`Checking for metadata parameters: ${dto.metadata}`)
      integration.validateMetadataParameters(dto.metadata, !isCreate)

      this.logger.log(`Testing configuration for integration: ${dto.name}`)
      await integration.validateConfiguration(dto.metadata)
    }
  }
}
