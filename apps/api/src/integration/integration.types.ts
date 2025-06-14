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
  eventId?: Event['id']
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
export interface IntegrationMetadata {}

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

export interface IntegrationWithLastUpdatedBy extends Integration {
  lastUpdatedBy: {
    id: string
    name: string
    profilePictureUrl: string
  }
}

export interface IntegrationWithLastUpdatedByAndReferences
  extends IntegrationWithLastUpdatedBy {
  workspace: Workspace
  project: {
    id: string
    name: string
    slug: string
  } | null
  environment: {
    id: string
    name: string
    slug: string
  } | null
}
