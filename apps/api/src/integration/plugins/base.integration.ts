import {
  Event,
  EventType,
  IntegrationRun,
  IntegrationRunStatus,
  IntegrationType
} from '@prisma/client'
import {
  EnvironmentSupportType,
  HydratedIntegration,
  IntegrationEventData,
  IntegrationMetadata,
  IntegrationRunData,
  IntegrationWithEnvironmentsAndMetadata
} from '../integration.types'
import {
  BadRequestException,
  InternalServerErrorException,
  Logger
} from '@nestjs/common'
import { constructErrorBody, decryptMetadata } from '@/common/util'
import { PrismaService } from '@/prisma/prisma.service'
import { Project } from '@keyshade/schema'

/**
 * The integration abstract class that every integration must extend.
 */
export abstract class BaseIntegration {
  protected readonly logger = new Logger(BaseIntegration.name)
  protected integration:
    | HydratedIntegration
    | Omit<HydratedIntegration, 'entitlements'>
    | null = null

  constructor(
    private readonly integrationType: IntegrationType,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Call this function to initialize the prerequisites needed by the integration.
   * You will need to extend this function in your plugin class, and use this function
   * to make actual calls to the APIs that will perform the desired operations.
   * @param privateKey The private key of the project that will be optionally stored on the integration platform
   * @param eventId The id of the event that triggered the integration
   */
  abstract init(
    privateKey: Project['privateKey'],
    eventId: Event['id']
  ): Promise<void>

  /**
   * Call the actual API for the specific integration.
   * You will need to extend this function in your plugin class, and use this function
   * to make actual calls to the APIs that will perform the desired operations.
   * @param data The data that will be sent to the integration.
   */
  abstract emitEvent(data: IntegrationEventData): Promise<void>

  /**
   * Use this function to outline the event types that will be supported by the integration.
   */
  abstract getPermittedEvents(): Set<string>

  /**
   * Use this function to list the required metadata parameters for the integration.
   */
  abstract getRequiredMetadataParameters(): Set<string>

  /**
   * Use this function to test the condfiguration of the integration.
   */
  abstract validateConfiguration(metadata: IntegrationMetadata): Promise<void>

  // WARNING: DO NOT OVERRIDE
  protected async registerIntegrationRun({
    eventId,
    integrationId,
    title
  }: IntegrationRunData): Promise<IntegrationRun> {
    this.logger.log(
      `Registering integration run for event ${eventId} with title ${title}`
    )

    const integrationRun = await this.prisma.integrationRun.create({
      data: {
        title,
        duration: 0,
        triggeredAt: new Date(),
        status: IntegrationRunStatus.RUNNING,
        eventId: eventId,
        integrationId: integrationId
      }
    })
    this.logger.log(
      `Registered integration run ${integrationRun.id} for event ${eventId} with title ${title}`
    )

    return integrationRun
  }

  protected async markIntegrationRunAsFinished(
    integrationRunId: IntegrationRun['id'],
    status: IntegrationRunStatus,
    duration: IntegrationRun['duration'],
    logs: IntegrationRun['logs']
  ): Promise<void> {
    this.logger.log(`Marking integration run ${integrationRunId} as ${status}`)
    await this.prisma.integrationRun.update({
      where: { id: integrationRunId },
      data: {
        status,
        duration,
        logs
      }
    })
    this.logger.log(`Marked integration run ${integrationRunId} as ${status}`)
  }

  public setIntegration<T extends IntegrationMetadata>(
    integration: HydratedIntegration | Omit<HydratedIntegration, 'entitlements'>
  ): void {
    this.integration = integration

    // @ts-expect-error -- this is expected here
    integration.metadata = decryptMetadata<T>(integration.metadata)
  }

  public getIntegration<
    T extends IntegrationMetadata
  >(): IntegrationWithEnvironmentsAndMetadata<T> {
    if (!this.integrationType) {
      throw new InternalServerErrorException('Integration not set')
    }
    // @ts-expect-error -- returns the correct value
    return this.integration
  }

  public isProjectRequired(): boolean {
    return false
  }

  public isPrivateKeyRequired(): boolean {
    return false
  }

  public environmentSupport(): EnvironmentSupportType {
    return 'any'
  }

  // WARNING: DO NOT OVERRIDE
  validatePermittedEvents(events: EventType[]): void {
    events.forEach((event) => {
      if (!this.getPermittedEvents().has(event)) {
        throw new BadRequestException(
          constructErrorBody(
            'Event not supported by integration',
            `Event ${event} is not permitted for ${this.integrationType.toString()} integration`
          )
        )
      }
    })
  }

  // WARNING: DO NOT OVERRIDE
  validateMetadataParameters(
    metadata: Record<string, unknown>,
    partialCheck?: boolean
  ): void {
    if (partialCheck) {
      Object.keys(metadata).forEach((key) => {
        if (!this.getRequiredMetadataParameters().has(key)) {
          throw new BadRequestException(
            constructErrorBody(
              'Unknown metadata parameter',
              `Unknown parameter ${key} for ${this.integrationType.toString()} integration`
            )
          )
        }
      })
    } else {
      this.getRequiredMetadataParameters().forEach((param) => {
        if (!metadata[param] || metadata[param] === '') {
          throw new BadRequestException(
            constructErrorBody(
              'Missing metadata parameter',
              `Missing required parameter ${param} for ${this.integrationType.toString()} integration`
            )
          )
        }
      })
    }
  }
}
