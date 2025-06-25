import { EventTypeEnum, IntegrationTypeEnum } from '@keyshade/schema'

export interface MetadataField {
  name: string
  description?: string
  requestFieldName: string
  placeholder?: string
  isEnvironment?: boolean
}

export interface IntegrationConfig {
  name: string
  type: IntegrationTypeEnum
  events: GroupItem[]
  metadataFields: MetadataField[]
  envMapping: boolean
}

interface GroupItem {
  name: string
  description: string
  level: number
  items: EventTypeEnum[]
}

export interface VercelEnvironmentMapping {
  [environmentName: string]: {
    vercelSystemEnvironment?: 'production' | 'preview' | 'development'
    vercelCustomEnvironmentId?: string
  }
}

const eventGroups: GroupItem[] = [
  {
    name: 'Workspace Events',
    description: 'Get notified about all workspace-related events',
    level: 1,
    items: [
      'INVITED_TO_WORKSPACE',
      'REMOVED_FROM_WORKSPACE',
      'ACCEPTED_INVITATION',
      'DECLINED_INVITATION',
      'CANCELLED_INVITATION',
      'LEFT_WORKSPACE',
      //'WORKSPACE_MEMBERSHIP_UPDATED',
      'WORKSPACE_UPDATED',
      'WORKSPACE_CREATED'
    ]
  },
  {
    name: 'Workspace Role Events',
    description: 'Get notified about all workspace role-related events',
    level: 2,
    items: [
      'WORKSPACE_ROLE_CREATED',
      'WORKSPACE_ROLE_UPDATED',
      'WORKSPACE_ROLE_DELETED'
    ]
  },
  {
    name: 'Project Events',
    description: 'Get notified about all project-related events',
    level: 3,
    items: ['PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED']
  },
  {
    name: 'Secret Events',
    description: 'Get notified about all secret-related events',
    level: 4,
    items: ['SECRET_UPDATED', 'SECRET_DELETED', 'SECRET_ADDED']
  },
  {
    name: 'Variable Events',
    description: 'Get notified about all variable-related events',
    level: 5,
    items: ['VARIABLE_UPDATED', 'VARIABLE_DELETED', 'VARIABLE_ADDED']
  },
  {
    name: 'Environment Events',
    description: 'Get notified about all environment-related events',
    level: 6,
    items: ['ENVIRONMENT_UPDATED', 'ENVIRONMENT_DELETED', 'ENVIRONMENT_ADDED']
  },
  {
    name: 'Integration Events',
    description: 'Get notified about all integration-related events',
    level: 7,
    items: ['INTEGRATION_ADDED', 'INTEGRATION_UPDATED', 'INTEGRATION_DELETED']
  }
]

const selectedEventGroups: GroupItem[] = [eventGroups[3], eventGroups[4]]

export const Integrations: Record<string, IntegrationConfig> = {
  DISCORD: {
    name: 'Discord',
    type: 'DISCORD',
    events: eventGroups,
    envMapping: false,
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
    events: eventGroups,
    envMapping: false,
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
  },
  VERCEL: {
    name: 'Vercel',
    type: 'VERCEL',
    events: selectedEventGroups,
    envMapping: true,
    metadataFields: [
      {
        name: 'Token',
        description: 'The token Keyshade will use to make requests to Vercel',
        requestFieldName: 'token',
        placeholder: 'your-vercel-token'
      },
      {
        name: 'Project ID',
        description: 'The ID of the Vercel project to integrate with',
        requestFieldName: 'projectId',
        placeholder: 'your-vercel-project-id'
      },
      {
        name: 'Environments',
        description:
          'The environments to integrate with (e.g., production, staging)',
        requestFieldName: 'environments',
        placeholder: 'production,staging',
        isEnvironment: true
      }
    ]
  }
}
