import {
  EventType,
  Integration,
  IntegrationRun,
  IntegrationRunStatus,
  IntegrationType
} from '@prisma/client'
import {
  IntegrationMetadata,
  IntegrationEventData,
  IntegrationRunData
} from '../integration.types'
import { BadRequestException, Logger } from '@nestjs/common'
import { constructErrorBody } from '@/common/util'
import { PrismaService } from '@/prisma/prisma.service'

/**
 * The integration abstract class that every integration must extend.
 */
export abstract class BaseIntegration {
  protected readonly logger = new Logger(BaseIntegration.name)

  constructor(
    private readonly integrationType: IntegrationType,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Call the actual API for the specific integration.
   * You will need to extend this function in your plugin class, and use this function
   * to make actual calls to the APIs that will perform the desired operations.
   * @param data The data that will be sent to the integration.
   * @param metadata The metadata data that will be used to authenticate with the integration and perform the tasks.
   * @param integrationId The id of the integration that is being used.
   */
  abstract emitEvent(
    data: IntegrationEventData,
    metadata: IntegrationMetadata,
    integrationId: Integration['id']
  ): Promise<void>

  /**
   * Use this function to outline the event types that will be supported by the integration.
   */
  abstract getPermittedEvents(): Set<string>

  /**
   * Use this function to list the required metadata parameters for the integration.
   */
  abstract getRequiredMetadataParameters(): Set<string>

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
  validateMetadataParameters(metadata: Record<string, string>): void {
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
