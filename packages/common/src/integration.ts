import { EventTypeEnum, IntegrationTypeEnum } from '@keyshade/schema'

export interface MetadataField {
  name: string
  description?: string
  requestFieldName: string
  placeholder?: string
}

export interface IntegrationConfig {
  name: string
  type: IntegrationTypeEnum
  events: EventTypeEnum[]
  metadataFields: MetadataField[]
}

const COMMUNICATION_EVENTS: EventTypeEnum[] = [
  'INVITED_TO_WORKSPACE',
  'REMOVED_FROM_WORKSPACE',
  'ACCEPTED_INVITATION',
  'DECLINED_INVITATION',
  'CANCELLED_INVITATION',
  'LEFT_WORKSPACE',
  'WORKSPACE_MEMBERSHIP_UPDATED',
  'WORKSPACE_UPDATED',
  'WORKSPACE_CREATED',
  'WORKSPACE_ROLE_CREATED',
  'WORKSPACE_ROLE_UPDATED',
  'WORKSPACE_ROLE_DELETED',
  'PROJECT_CREATED',
  'PROJECT_UPDATED',
  'PROJECT_DELETED',
  'SECRET_UPDATED',
  'SECRET_DELETED',
  'SECRET_ADDED',
  'VARIABLE_UPDATED',
  'VARIABLE_DELETED',
  'VARIABLE_ADDED',
  'ENVIRONMENT_UPDATED',
  'ENVIRONMENT_DELETED',
  'ENVIRONMENT_ADDED',
  'INTEGRATION_ADDED',
  'INTEGRATION_UPDATED',
  'INTEGRATION_DELETED'
]

// const CONFIGURATION_EVENTS: EventTypeEnum[] = [
//   'VARIABLE_ADDED',
//   'VARIABLE_DELETED',
//   'VARIABLE_UPDATED',
//   'SECRET_ADDED',
//   'SECRET_DELETED',
//   'SECRET_UPDATED'
// ]

export const Integrations: Record<string, IntegrationConfig> = {
  DISCORD: {
    name: 'Discord',
    type: 'DISCORD',
    events: COMMUNICATION_EVENTS,
    metadataFields: [
      {
        name: 'Webhook URL',
        description: 'The webhook URL Keyshade will make requests to',
        requestFieldName: 'webhookUrl',
        placeholder: 'https://discordapp.com/api/webhooks/.....'
      }
    ]
  },
  SLACK: {
    name: 'Slack',
    type: 'SLACK',
    events: COMMUNICATION_EVENTS,
    metadataFields: [
      {
        name: 'Bot Token',
        description:
          'The bot token Keyshade will use to make requests to Slack',
        requestFieldName: 'botToken',
        placeholder: 'xoxb-...'
      },
      {
        name: 'Signing Secret',
        description:
          'The signing secret Keyshade will use to make requests to Slack',
        requestFieldName: 'signingSecret',
        placeholder: 'xoxs-...'
      },
      {
        name: 'Channel ID',
        description:
          'The channel ID Keyshade will use to make requests to Slack',
        requestFieldName: 'channelId',
        placeholder: 'KS1234567'
      }
    ]
  }
}
