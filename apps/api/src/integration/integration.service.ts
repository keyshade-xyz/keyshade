import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger
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
import { HydrationService } from '@/common/hydration.service'
import { InclusionQuery } from '@/common/inclusion-query'
import { HydratedIntegration } from './integration.types'
import { WorkspaceCacheService } from '@/cache/workspace-cache.service'
import { TierLimitService } from '@/common/tier-limit.service'

@Injectable()
export class IntegrationService {
  private readonly logger = new Logger(IntegrationService.name)

  constructor(
    private readonly prisma: PrismaService,
    private readonly authorizationService: AuthorizationService,
    private readonly slugGenerator: SlugGenerator,
    private readonly hydrationService: HydrationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    private readonly tierLimitService: TierLimitService
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
    workspaceSlug: Workspace['slug']
  ) {
    this.logger.log(
      `User ${user.id} attempted to create integration ${dto.name} in workspace ${workspaceSlug}`
    )

    // Check if only environments are provided
    if (
      dto.environmentSlugs &&
      dto.environmentSlugs.length > 0 &&
      !dto.projectSlug
    ) {
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

    // Create the integration object
    this.logger.log(`Creating integration object of type ${dto.type}`)
    let integrationObject = IntegrationFactory.createIntegrationWithType(
      dto.type,
      this.prisma
    )

    this.validateEnvironmentSupport(
      integrationObject,
      dto.type,
      dto.environmentSlugs
    )

    // Validate project support
    if (integrationObject.isProjectRequired() && !dto.projectSlug) {
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

    // Check if the user is permitted to create integrations in the workspace
    this.logger.log(`Checking user access to workspace ${workspaceSlug}`)
    const workspace =
      await this.authorizationService.authorizeUserAccessToWorkspace({
        user,
        slug: workspaceSlug,
        authorities: [Authority.CREATE_INTEGRATION, Authority.READ_WORKSPACE]
      })
    const workspaceId = workspace.id

    await this.tierLimitService.checkIntegrationLimitReached(workspace)

    if (workspace.isDisabled) {
      this.logger.log(
        `User ${user.id} attempted to create integration ${dto.name} in disabled workspace ${workspaceSlug}`
      )
      throw new BadRequestException(
        constructErrorBody(
          'This workspace has been disabled',
          'To use the workspace again, remove the previum resources, or upgrade to a paid plan'
        )
      )
    }

    // Check if integration with the same name already exists
    await this.existsByNameAndWorkspaceId(dto.name, workspace.id)

    let project: Project | null = null
    let privateKey: string | null = null
    const environments: Array<Environment> | null = []

    // Check if the user has READ authority over the project
    if (dto.projectSlug) {
      this.logger.log(`Checking user access to project ${dto.projectSlug}`)
      project = await this.authorizationService.authorizeUserAccessToProject({
        user,
        slug: dto.projectSlug,
        authorities: [Authority.READ_PROJECT]
      })

      privateKey =
        project.storePrivateKey && project.privateKey
          ? project.privateKey
          : dto.privateKey

      // Validate private key support
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
            slug: environmentSlug,
            authorities: [Authority.READ_ENVIRONMENT]
          })
        environments.push(environment)
      }
    }

    await this.validateEventsAndMetadataParams(dto, integrationObject, true)

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
        environments:
          environments.length > 0
            ? {
                connect: environments.map((environment) => ({
                  id: environment.id
                }))
              }
            : undefined,
        projectId: project?.id,
        workspaceId,
        lastUpdatedById: user.id
      },
      include: InclusionQuery.Integration
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
    const hydratedIntegration = await this.hydrationService.hydrateIntegration({
      user,
      integration
    })
    integrationObject = IntegrationFactory.createIntegration(
      hydratedIntegration,
      this.prisma
    )
    await integrationObject.init(privateKey, event.id)

    await this.workspaceCacheService.addIntegrationToRawWorkspace(
      workspace,
      integration
    )

    // integration.metadata = decryptMetadata(integration.metadata)
    delete hydratedIntegration.workspace

    return hydratedIntegration
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
        slug: integrationSlug,
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
    dto.name &&
      (await this.existsByNameAndWorkspaceId(dto.name, integration.workspaceId))

    let environments: Array<Environment> | null = null
    if (dto.environmentSlugs) {
      this.validateEnvironmentSupport(
        integrationObject,
        integration.type,
        dto.environmentSlugs
      )

      // Check if only environments are provided and the integration has no project associated from prior
      if (!integration.projectId) {
        this.logger.error(
          `Can not provide environment without project. Environment slug: ${dto.environmentSlugs}`
        )
        throw new BadRequestException(
          constructErrorBody(
            'Can not provide environment without project',
            'Environment can only be provided if project is also provided'
          )
        )
      }

      // If the environment is being changed, check if the user has READ authority over the new environment
      this.logger.log(
        `Checking user access to environments ${dto.environmentSlugs.join(', ')}`
      )
      environments = await Promise.all(
        dto.environmentSlugs.map((environmentSlug) =>
          this.authorizationService.authorizeUserAccessToEnvironment({
            user,
            slug: environmentSlug,
            authorities: [Authority.READ_ENVIRONMENT]
          })
        )
      )
    }

    await this.validateEventsAndMetadataParams(dto, integrationObject, false)

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
      include: InclusionQuery.Integration
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
    updatedIntegration['entitlements'] = integration.entitlements
    delete updatedIntegration.workspace

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
        slug: integrationSlug,
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
        slug: workspaceSlug,
        authorities: [Authority.READ_INTEGRATION]
      })

    const rawWorkspace = await this.workspaceCacheService.getRawWorkspace(
      workspace.slug
    )

    const hydratedIntegrations: HydratedIntegration[] = []

    for (const integration of rawWorkspace.integrations) {
      try {
        const hydratedIntegration =
          await this.authorizationService.authorizeUserAccessToIntegration({
            user,
            slug: integration.slug,
            authorities: [Authority.READ_INTEGRATION]
          })
        // @ts-expect-error -- We expect the metadata to be in JSON format
        hydratedIntegration.metadata = decryptMetadata(integration.metadata)
        delete hydratedIntegration.workspace
        hydratedIntegrations.push(hydratedIntegration)
      } catch (_ignored) {}
    }

    const metadata = paginate(
      hydratedIntegrations.length,
      `/integration/all/${workspaceSlug}`,
      {
        page,
        limit: limitMaxItemsPerPage(limit),
        sort,
        order,
        search
      }
    )

    return { items: hydratedIntegrations, metadata }
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
        slug: integrationSlug,
        authorities: [Authority.DELETE_INTEGRATION]
      })
    const integrationId = integration.id

    await this.prisma.integration.delete({
      where: { id: integrationId }
    })

    this.logger.log(
      `Integration ${integrationId} deleted by user ${user.id} in workspace ${integration.workspaceId}`
    )

    const workspace = await this.prisma.workspace.findUnique({
      where: {
        id: integration.workspaceId
      }
    })
    await this.workspaceCacheService.removeIntegrationFromRawWorkspace(
      workspace,
      integration.id
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
        slug: integrationSlug,
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
   * @param isIntegrationNew - True if validating for a new integration; false for update.
   * @param integrationSlug - Slug of the existing integration (required when isIntegrationNew is false).
   * @returns A promise resolving to { success: true } upon successful validation.
   * @throws BadRequestException if integrationSlug is missing when updating.
   * @throws UnauthorizedException if the user is not authorized to update the integration.
   * @throws BadRequestException if event subscriptions or metadata parameters are invalid.
   * @throws BadRequestException if live configuration testing via validateConfiguration fails.
   */
  async validateIntegrationMetadata(
    user: AuthenticatedUser,
    dto: CreateIntegration | UpdateIntegration,
    isIntegrationNew: boolean,
    integrationSlug?: Integration['slug']
  ): Promise<{ success: true }> {
    this.logger.log(
      `User ${user.id} is metadata‐validating integration ${dto.name} ` +
        (isIntegrationNew ? `(new)` : `(existing ${integrationSlug})`)
    )

    let integrationObject: BaseIntegration
    if (isIntegrationNew) {
      integrationObject = IntegrationFactory.createIntegrationWithType(
        (dto as CreateIntegration).type,
        this.prisma
      )
    } else {
      if (!integrationSlug) {
        throw new InternalServerErrorException(
          constructErrorBody(
            'Uh-oh, something went wront on our end',
            'We have faced an issue while validating your integration. Please try again later, or get in touch with us at support@keyshade.xyz'
          )
        )
      }
      const existing =
        await this.authorizationService.authorizeUserAccessToIntegration({
          user,
          slug: integrationSlug,
          authorities: [Authority.UPDATE_INTEGRATION]
        })
      integrationObject = IntegrationFactory.createIntegrationWithType(
        existing.type,
        this.prisma
      )
    }

    await this.validateEventsAndMetadataParams(
      dto,
      integrationObject,
      isIntegrationNew
    )

    return { success: true }
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
    workspaceId: Workspace['id']
  ) {
    this.logger.log(
      `Checking if integration with name ${name} exists in workspace ${workspaceId}`
    )

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
      this.logger.error(
        `Integration with name ${name} already exists in workspace ${workspaceId}`
      )
      throw new ConflictException(
        constructErrorBody(
          'Integration already exists',
          'An integration with this name already exists in this workspace. Please choose a different name.'
        )
      )
    } else {
      this.logger.log(
        `Integration with name ${name} does not exist in workspace ${workspaceId}`
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
   * Validate metadata parameters, permitted events and live configuration testing.
   *
   * @param dto - CreateIntegration or UpdateIntegration DTO.
   * @param integration - The BaseIntegration instance responsible for validation logic.
   * @param isIntegrationNew - True if this invocation is part of a create operation;
   *   false if part of update.
   * @returns A promise that resolves when all validations complete.
   * @throws BadRequestException if event subscriptions or metadata parameters are invalid.
   * @throws BadRequestException if live configuration testing via validateConfiguration fails.
   */
  private async validateEventsAndMetadataParams(
    dto: CreateIntegration | UpdateIntegration,
    integration: BaseIntegration,
    isIntegrationNew: boolean
  ): Promise<void> {
    if ('notifyOn' in dto && dto.notifyOn) {
      this.logger.log(`Checking for permitted events: ${dto.notifyOn}`)
      integration.validatePermittedEvents(dto.notifyOn)
    }

    if ('metadata' in dto && dto.metadata) {
      this.logger.log(`Checking for metadata parameters: ${dto.metadata}`)
      integration.validateMetadataParameters(dto.metadata, !isIntegrationNew)

      this.logger.log(`Testing configuration for integration: ${dto.name}`)
      await integration.validateConfiguration(dto.metadata)
    }
  }
}
