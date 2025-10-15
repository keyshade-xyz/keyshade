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

  // Vercel environments mapping with keyshade environment slugs
  environments: Record<
    Environment['slug'],
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

export type IntegrationWithEnvironmentsAndMetadata<
  T extends IntegrationMetadata
> = Omit<HydratedIntegration, 'metadata'> & {
  metadata: T
}

export interface HydratedIntegration extends Integration {
  lastUpdatedBy: {
    id: string
    name?: string | null
    profilePictureUrl?: string | null
  } | null

  /** Total number of triggers for this integration (computed by hydration) */
  totalTriggers?: number

  entitlements: {
    canDelete: boolean
    canUpdate: boolean
  }
  // Included relational fields from Prisma InclusionQuery.Integration
  workspace?: Workspace
  project?: {
    id: Project['id']
    name: Project['name']
    slug: Project['slug']
    workspaceId: Project['workspaceId']
  } | null
  environments?: Array<{
    id: Environment['id']
    name: Environment['name']
    slug: Environment['slug']
  }>
}

export interface RawIntegration
  extends Omit<HydratedIntegration, 'entitlements' | 'totalTriggers'> {}
export type EnvironmentSupportType = 'single' | 'atleast-one' | 'any'
