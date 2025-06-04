import {
  EventType,
  Integration,
  IntegrationRunStatus,
  IntegrationType
} from '@prisma/client'
import {
  SlackIntegrationMetadata,
  IntegrationEventData
} from '../integration.types'
import { App } from '@slack/bolt'
import { BaseIntegration } from './base.integration'
import { PrismaService } from '@/prisma/prisma.service'
import { makeTimedRequest } from '@/common/util'
import { InternalServerErrorException } from '@nestjs/common'

export class SlackIntegration extends BaseIntegration {
  private app: App
  constructor(integrationType: IntegrationType, prisma: PrismaService) {
    super(integrationType, prisma)
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
    return new Set(['botToken', 'signingSecret', 'channelId'])
  }

  async emitEvent(
    data: IntegrationEventData,
    metadata: SlackIntegrationMetadata,
    integrationId: Integration['id']
  ): Promise<void> {
    this.logger.log(`Emitting event to Slack: ${data.title}`)

    try {
      const { id: integrationRunId } = await this.registerIntegrationRun({
        eventId: data.eventId,
        integrationId,
        title: 'Posting message to Slack'
      })

      if (!this.app) {
        this.app = new App({
          token: metadata.botToken,
          signingSecret: metadata.signingSecret
        })
      }
      const block = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Update occurred on keyshade',
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${data.title ?? 'No title provided'}*\n${data.description ?? 'No description provided'}`
          }
        },
        {
          type: 'divider'
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*Event:*\n${data.title}`
            },
            {
              type: 'mrkdwn',
              text: `*Source:*\n${data.source}`
            }
          ]
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '<https://keyshade.xyz|View in Keyshade>'
            }
          ]
        }
      ]

      const { response, duration } = await makeTimedRequest(() =>
        this.app.client.chat.postMessage({
          channel: metadata.channelId,
          blocks: block,
          text: data.title
        })
      )

      await this.markIntegrationRunAsFinished(
        integrationRunId,
        response.ok
          ? IntegrationRunStatus.SUCCESS
          : IntegrationRunStatus.FAILED,
        duration,
        response.message.text
      )

      if (!response.ok) {
        this.logger.error(
          `Failed to emit event to Slack: ${response.status} - ${response.statusText}`
        )
      } else {
        this.logger.log(`Event emitted to Slack in ${duration}ms`)
      }
    } catch (error) {
      this.logger.error(`Failed to emit event to Slack: ${error}`)
      throw new InternalServerErrorException('Failed to emit event to Slack')
    }
  }
}
