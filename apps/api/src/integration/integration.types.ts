import {
  Environment,
  EventSource,
  EventType,
  Integration,
  Project,
  Secret,
  Variable,
  Workspace,
  WorkspaceRole
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

export interface IntegrationWithWorkspace extends Integration {
  workspace: Workspace
}
