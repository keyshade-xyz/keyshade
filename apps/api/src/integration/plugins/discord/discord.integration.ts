import { EventType, IntegrationType } from '@prisma/client'
import {
  DiscordIntegrationMetadata,
  IntegrationEventData
} from '../../integration.types'
import { BaseIntegration } from '../base.integration'
import { Logger } from '@nestjs/common'

export class DiscordIntegration extends BaseIntegration {
  private readonly logger = new Logger('DiscordIntegration')

  constructor() {
    super(IntegrationType.DISCORD)
  }

  public getPermittedEvents(): Set<EventType> {
    return new Set([
      EventType.APPROVAL_APPROVED,
      EventType.APPROVAL_REJECTED,
      EventType.INTEGRATION_ADDED,
      EventType.INTEGRATION_UPDATED,
      EventType.INTEGRATION_DELETED,
      EventType.INVITED_TO_WORKSPACE,
      EventType.REMOVED_FROM_WORKSPACE,
      EventType.ACCEPTED_INVITATION,
      EventType.DECLINED_INVITATION,
      EventType.CANCELLED_INVITATION,
      EventType.LEFT_WORKSPACE,
      EventType.WORKSPACE_UPDATED,
      EventType.WORKSPACE_CREATED,
      EventType.WORKSPACE_ROLE_CREATED,
      EventType.WORKSPACE_ROLE_UPDATED,
      EventType.WORKSPACE_ROLE_DELETED,
      EventType.PROJECT_CREATED,
      EventType.PROJECT_UPDATED,
      EventType.PROJECT_DELETED,
      EventType.SECRET_UPDATED,
      EventType.SECRET_DELETED,
      EventType.SECRET_ADDED,
      EventType.VARIABLE_UPDATED,
      EventType.VARIABLE_DELETED,
      EventType.VARIABLE_ADDED,
      EventType.ENVIRONMENT_UPDATED,
      EventType.ENVIRONMENT_DELETED,
      EventType.ENVIRONMENT_ADDED,
      EventType.APPROVAL_CREATED,
      EventType.APPROVAL_UPDATED,
      EventType.APPROVAL_DELETED,
      EventType.APPROVAL_APPROVED,
      EventType.APPROVAL_REJECTED,
      EventType.INTEGRATION_ADDED,
      EventType.INTEGRATION_UPDATED,
      EventType.INTEGRATION_DELETED
    ])
  }

  public getRequiredMetadataParameters(): Set<string> {
    return new Set(['webhookUrl'])
  }

  async emitEvent(
    data: IntegrationEventData,
    metadata: DiscordIntegrationMetadata
  ): Promise<void> {
    this.logger.log(`Emitting event to Discord: ${data.title}`)

    const response = await fetch(metadata.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Update occurred on keyshade',
        embeds: [
          {
            title: data.title ?? 'No title provided',
            description: data.description ?? 'No description provided',
            author: {
              name: 'keyshade',
              url: 'https://keyshade.xyz'
            },
            fields: [
              {
                name: 'Event',
                value: data.title
              },
              {
                name: 'Source',
                value: data.source
              }
            ]
          }
        ]
      })
    })

    if (!response.ok) {
      this.logger.error(
        `Failed to emit event to Discord: ${response.status} ${response.statusText}`
      )
    }
  }
}
