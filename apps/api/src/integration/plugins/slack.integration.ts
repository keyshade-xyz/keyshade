import {
  EventType,
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
import {
  constructErrorBody,
  decryptMetadata,
  makeTimedRequest
} from '@/common/util'
import {
  BadRequestException,
  InternalServerErrorException
} from '@nestjs/common'

export class SlackIntegration extends BaseIntegration {
  private app: App

  constructor(prisma: PrismaService) {
    super(IntegrationType.SLACK, prisma)
  }

  public init(): Promise<void> {
    // TODO: implement this
    return Promise.resolve()
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

  private async getSlackApp() {
    if (!this.app) {
      this.logger.log('Generating Slack app...')
      const integration = this.getIntegration<SlackIntegrationMetadata>()
      this.app = new App({
        token: integration.metadata.botToken,
        signingSecret: integration.metadata.signingSecret
      })
      this.logger.log('Generated Slack app...')
    }

    return this.app
  }

  async emitEvent(data: IntegrationEventData): Promise<void> {
    this.logger.log(`Emitting event to Slack: ${data.title}`)

    const integration = this.getIntegration<SlackIntegrationMetadata>()

    try {
      const { id: integrationRunId } = await this.registerIntegrationRun({
        eventId: data.event.id,
        integrationId: integration.id,
        title: 'Posting message to Slack'
      })

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

      this.app = await this.getSlackApp()

      const { response, duration } = await makeTimedRequest(() =>
        this.app.client.chat.postMessage({
          channel: integration.metadata.channelId,
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

  public async validateConfiguration(metadata: SlackIntegrationMetadata) {
    this.logger.log(
      `Validating Slack integration (channel: ${metadata.channelId})`
    )

    const { data: authData, duration: authDur } = await this.slackApi<{
      ok: boolean
      user_id: string
      error?: string
    }>('auth.test', {}, metadata.botToken)
    this.logger.log(`auth.test ok=${authData.ok} in ${authDur}ms`)
    if (!authData.ok) {
      throw new BadRequestException(
        constructErrorBody('Slack token validation failed', authData.error)
      )
    }

    const userId = authData.user_id

    const { data: ephData, duration: ephDur } = await this.slackApi<{
      ok: boolean
      error?: string
    }>(
      'chat.postEphemeral',
      {
        channel: metadata.channelId,
        user: userId,
        text: "Keyshade write-test (you won't see this after validation!)"
      },
      metadata.botToken
    )
    this.logger.log(`chat.postEphemeral ok=${ephData.ok} in ${ephDur}ms`)
    if (!ephData.ok) {
      throw new BadRequestException(
        constructErrorBody('Slack write validation failed', ephData.error!)
      )
    }

    this.logger.log(
      `Slack write validation succeeded (ephemeral in ${metadata.channelId}).`
    )
  }

  private async slackApi<T extends { ok: boolean; error?: string }>(
    method: string,
    params: Record<string, string>,
    token: string
  ): Promise<{ data: T; duration: number }> {
    const url = `https://slack.com/api/${method}`
    const body = new URLSearchParams(params).toString()
    const start = Date.now()
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    })
    const data = await res.json()
    return { data, duration: Date.now() - start }
  }
}
