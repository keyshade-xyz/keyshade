import {
  Event,
  EventType,
  IntegrationRunStatus,
  IntegrationType,
  Project
} from '@prisma/client'
import {
  DiscordIntegrationMetadata,
  IntegrationEventData
} from '../integration.types'
import { BaseIntegration } from './base.integration'
import { PrismaService } from '@/prisma/prisma.service'
import { constructErrorBody, makeTimedRequest } from '@/common/util'
import { BadRequestException } from '@nestjs/common'

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

  public async init(
    privateKey: Project['privateKey'],
    eventId: Event['id']
  ): Promise<void> {
    this.logger.log('Initializing Discord integration...')

    const integration = this.getIntegration<DiscordIntegrationMetadata>()

    const { id: integrationRunId } = await this.registerIntegrationRun({
      eventId,
      integrationId: integration.id,
      title: 'Initializing Discord integration'
    })

    try {
      const body = {
        content: '🥁 Keyshade is now configured with this channel',
        embeds: [
          {
            title: '🎉 Keyshade Integration Successful!',
            description:
              'Your Discord channel is now connected to Keyshade. You will receive notifications for configured events.',
            color: 0x00ff00,
            author: {
              name: 'Keyshade',
              url: 'https://keyshade.xyz'
            },
            fields: [
              {
                name: 'Status',
                value: '✅ Connected',
                inline: true
              },
              {
                name: 'Webhook',
                value: '✅ Valid',
                inline: true
              }
            ],
            footer: {
              text: 'Keyshade Integration'
            },
            timestamp: new Date().toISOString()
          }
        ]
      }
      const { response, duration } = await makeTimedRequest(() =>
        fetch(integration.metadata.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        })
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        response.ok
          ? IntegrationRunStatus.SUCCESS
          : IntegrationRunStatus.FAILED,
        duration,
        await response.text()
      )

      if (!response.ok) {
        this.logger.error(
          `Failed to send initialization message to Discord: ${response.status} ${response.statusText}`
        )
        throw new BadRequestException(
          constructErrorBody(
            'Discord initialization failed',
            `Discord returned ${response.status} ${response.statusText}`
          )
        )
      } else {
        this.logger.log(
          `Successfully sent initialization message to Discord in ${duration}ms`
        )
      }
    } catch (error) {
      this.logger.error(
        `Failed to send initialization message to Discord: ${error}`
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        IntegrationRunStatus.FAILED,
        0,
        error instanceof Error ? error.message : String(error)
      )

      throw new BadRequestException(
        constructErrorBody(
          'Discord initialization failed',
          'Failed to send initialization message to Discord'
        )
      )
    }
  }

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

  /**
   * Test that the webhook URL is valid & reachable.
   */
  public async validateConfiguration(metadata: DiscordIntegrationMetadata) {
    this.logger.log(`Validating Discord webhook URL: ${metadata.webhookUrl}`)

    const { response, duration } = await makeTimedRequest(() =>
      fetch(metadata.webhookUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
    )

    this.logger.log(
      `Discord validation responded ${response.status} in ${duration}ms`
    )

    if (!response.ok) {
      throw new BadRequestException(
        constructErrorBody(
          'Webhook validation failed',
          `Discord returned ${response.status} ${response.statusText}`
        )
      )
    }
  }
}
