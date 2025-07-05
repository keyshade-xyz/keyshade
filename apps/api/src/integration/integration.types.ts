import {
  Environment,
  EventSource,
  EventType,
  Integration,
  Project,
  Secret,
  Variable,
  Workspace,
  WorkspaceRole,
  Event,
  IntegrationRun
} from '@prisma/client'

/**
 * This data will be sent as an input to the integration.
 */
export interface IntegrationEventData {
  entity:
    | Workspace
    | Project
    | Environment
    | WorkspaceRole
    | Secret
    | Variable
    | Integration
  source: EventSource
  eventType: EventType
  title?: string
  description?: string
  event: Event
}

export interface IntegrationRunData {
  title: IntegrationRun['title']
  eventId: Event['id']
  integrationId: Integration['id']
}

/**
 * Extend this interface with the integration specific data that
 * will be used to authenticate with the integration and perform
 * specific tasks.
 */
export interface IntegrationMetadata extends Record<string, unknown> {}

/**
 * Integration metadata that would be common to all AWS integrations
 */
export interface BaseAWSIntegrationMetadata extends IntegrationMetadata {
  region: string
  accessKeyId: string
  secretAccessKey: string
}

/**
 * Discord Integration Data
 * @property webhookUrl The webhook URL that will be used to send messages to Discord.
 */
export interface DiscordIntegrationMetadata extends IntegrationMetadata {
  webhookUrl: string
}

export interface SlackIntegrationMetadata extends IntegrationMetadata {
  botToken: string
  signingSecret: string
  channelId: string
}

export interface VercelIntegrationMetadata extends IntegrationMetadata {
  // Vercel API Token
  token: string

  // Vercel project's ID for which the configuration will be managed
  projectId: string

  // Vercel environments mapping with keyshade environment names
  environments: Record<
    Environment['name'],
    {
      vercelSystemEnvironment?: 'production' | 'preview' | 'development'
      vercelCustomEnvironmentId?: string
    }
  >
}

export interface AWSLambdaIntegrationMetadata
  extends BaseAWSIntegrationMetadata {
  lambdaFunctionName: string
}

export interface IntegrationWithLastUpdatedBy extends Integration {
  lastUpdatedBy: {
    id: string
    name: string
    profilePictureUrl: string
  }
}

export interface IntegrationWithEnvironments extends Integration {
  environments: {
    id: string
    name: string
    slug: string
  }[]
}

export type IntegrationWithEnvironmentsAndMetadata<
  T extends IntegrationMetadata
> = Omit<IntegrationWithEnvironments, 'metadata'> & {
  metadata: T
}

export interface IntegrationWithLastUpdatedByAndReferences
  extends IntegrationWithLastUpdatedBy,
    IntegrationWithEnvironments {
  workspace: Workspace
  project: {
    id: string
    name: string
    slug: string
  } | null
}

export type EnvironmentSupportType = 'single' | 'atleast-one' | 'any'
