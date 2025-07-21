import {
  EventType,
  IntegrationRunStatus,
  IntegrationType
} from '@prisma/client'
import {
  DiscordIntegrationMetadata,
  IntegrationEventData
} from '../integration.types'
import { BaseIntegration } from './base.integration'
import { PrismaService } from '@/prisma/prisma.service'
import { makeTimedRequest } from '@/common/util'

export class DiscordIntegration extends BaseIntegration {
  constructor(prisma: PrismaService) {
    super(IntegrationType.DISCORD, prisma)
  }

  public getPermittedEvents(): Set<EventType> {
    return new Set([
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
      EventType.INTEGRATION_ADDED,
      EventType.INTEGRATION_UPDATED,
      EventType.INTEGRATION_DELETED
    ])
  }

  public getRequiredMetadataParameters(): Set<string> {
    return new Set(['webhookUrl'])
  }

// Edited Code starts for init 
  public async init(): Promise<void> {
  const integration = this.getIntegration<DiscordIntegrationMetadata>()
  
  this.logger.log('Initializing Discord integration')

  const { response } = await makeTimedRequest(() =>
    fetch(integration.metadata.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: 'Drum rolls! Keyshade is now configured with this channel'
      })
    })
  )

  if (!response.ok) {
    this.logger.error(
      `Failed to initialize Discord integration: ${response.status} ${response.statusText}`
    )
    throw new Error('Failed to initialize Discord integration')
  }

  this.logger.log('Successfully initialized Discord integration')
}

// Edited Code ends for init 

  async emitEvent(data: IntegrationEventData): Promise<void> {
    this.logger.log(`Emitting event to Discord: ${data.title}`)

    const integration = this.getIntegration<DiscordIntegrationMetadata>()

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId: data.event.id,
      integrationId: integration.id,
      title: 'Posting message to Discord'
    })

    const { response, duration } = await makeTimedRequest(() =>
      fetch(integration.metadata.webhookUrl, {
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
    )

    await this.markIntegrationRunAsFinished(
      integrationRunId,
      response.ok ? IntegrationRunStatus.SUCCESS : IntegrationRunStatus.FAILED,
      duration,
      await response.text()
    )

    if (!response.ok) {
      this.logger.error(
        `Failed to emit event to Discord: ${response.status} ${response.statusText}`
      )
    } else {
      this.logger.log(`Successfully emitted event to Discord: ${data.title}`)
    }
  }
}
