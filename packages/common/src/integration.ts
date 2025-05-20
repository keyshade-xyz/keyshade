export type IntegrationType = 'DISCORD' | 'SLACK'

export interface MetadataField {
  name: string
  description?: string
  requestFieldName: string
  placeholder?: string
}

export interface IntegrationConfig {
  name: string
  type: IntegrationType
  metadataFields: MetadataField[]
}

export const INTEGRATIONS_CONFIG: Record<string, IntegrationConfig> = {
  DISCORD: {
    name: 'Discord',
    type: 'DISCORD',
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

export const Integrations = {
  validTypes: Object.keys(INTEGRATIONS_CONFIG),

  get: (type: string): IntegrationConfig | undefined => {
    const normalizedType = type.toUpperCase()
    return INTEGRATIONS_CONFIG[normalizedType]
  },

  // Get all integrations
  getAll: (): IntegrationConfig[] => {
    return Object.values(INTEGRATIONS_CONFIG)
  },

  // Get metadata fields for any integration type
  metadata: (type: string): MetadataField[] => {
    const integration = Integrations.get(type)
    return integration?.metadataFields || []
  },

  //check valid integration type
  isValidType: (type: string): boolean => {
    return !!Integrations.get(type)
  }
}
