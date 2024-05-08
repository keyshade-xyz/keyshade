import { EventType, IntegrationType } from '@prisma/client'
import { IntegrationMetadata, IntegrationEventData } from '../integration.types'
import { BadRequestException } from '@nestjs/common'

/**
 * The integration abstract class that every integration must extend.
 */
export abstract class BaseIntegration {
  constructor(public readonly integrationType: IntegrationType) {}

  /**
   * Call the actual API for the specific integration.
   * You will need to extend this function in your plugin class, and use this function
   * to make actual calls to the APIs that will perform the desired operations.
   * @param data The data that will be sent to the integration.
   * @param metadata The metadata data that will be used to authenticate with the integration and perform the tasks.
   */
  abstract emitEvent(
    data: IntegrationEventData,
    metadata: IntegrationMetadata
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
  validatePermittedEvents(events: EventType[]): void {
    events.forEach((event) => {
      if (!this.getPermittedEvents().has(event)) {
        throw new BadRequestException(
          `Event ${event} is not permitted for this ${this.integrationType.toString()} integration`
        )
      }
    })
  }

  // WARNING: DO NOT OVERRIDE
  validateMetadataParameters(metadata: Record<string, string>): void {
    this.getRequiredMetadataParameters().forEach((param) => {
      if (!metadata[param] || metadata[param] === '') {
        throw new BadRequestException(
          `Missing required parameter ${param} for ${this.integrationType.toString()} integration`
        )
      }
    })
  }
}
