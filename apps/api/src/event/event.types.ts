import { Environment } from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'

export interface EventMetadata extends JsonObject {}

export interface ConfigurationAddedEventMetadata extends EventMetadata {
  name: string
  values: Record<Environment['slug'], string>
  isSecret: boolean
  isPlaintext: boolean
  description?: string
}

export interface ConfigurationUpdatedEventMetadata extends EventMetadata {
  oldName: string
  newName: string
  values: Record<Environment['slug'], string>
  isPlaintext: boolean
  isSecret: boolean
  description?: string
}

export interface ConfigurationDeletedEventMetadata extends EventMetadata {
  name: string
  environments: Environment['slug'][]
}

export interface EnvironmentAddedEventMetadata extends EventMetadata {
  name: Environment['name']
  description: Environment['description']
}

export interface EnvironmentUpdatedEventMetadata extends EventMetadata {
  name: Environment['name']
  description: Environment['description']
}

export interface EnvironmentDeletedEventMetadata extends EventMetadata {
  name: Environment['name']
}
