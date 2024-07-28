export interface CreateSecretRequest {
  projectId: string
  name: string
  entries: Entries[]
}

export interface Entries {
  value: string
  environmentId: string
}
export interface CreateSecretResponse {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  rotateAt: string | null
  note: string | null
  lastUpdatedById: string
  projectId: string
  project: Project
  versions: Entries[]
}

export interface Project {
  workspaceId: string
}
export interface UpdateSecretRequest {
  secretId: string
}
export interface UpdateSecretResponse {
  secret: any
  updatedVersions: any
}
export interface DeleteSecretRequest {
  secretId: string
}
export interface DeleteSecretResponse {}
export interface RollBackSecretRequest {
  environmentId: string
  version: number
  secretId: string
}
export interface RollBackSecretResponse {}
export interface getAllSecretsOfProjectRequest {
  projectId: string
}
export interface getAllSecretsOfProjectResponse {}
export interface getAllSecretsOfEnvironmentRequest {
  projectId: string
  environmentId: string
}
export interface getAllSecretsOfEnvironmentResponse {}
