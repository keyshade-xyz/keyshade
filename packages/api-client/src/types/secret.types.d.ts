import { PageRequest, PageResponse } from './index.types'

export interface CreateSecretRequest {
  projectSlug: string
  name: string
  note?: string
  rotateAfter?: '24' | '168' | '720' | '8760' | 'never'
  entries?: [
    {
      value: string
      environmentSlug: string
    }
  ]
}

export interface CreateSecretResponse {
  id: string
  name: string
  slug: string
  createdAt: string
  updatedAt: string
  rotateAt: string | null
  note: string | null
  lastUpdatedById: string
  projectId: string
  project: {
    workspaceId: string
  }
  versions: [
    {
      value: string
      environmentId: string
    }
  ]
}

export interface UpdateSecretRequest {
  secretSlug: string
  name?: string
  note?: string
  rotateAfter?: '24' | '168' | '720' | '8760' | 'never'
  entries?: [
    {
      value: string
      environmentSlug: string
    }
  ]
}

export interface UpdateSecretResponse {
  secret: {
    id: string
    name: string
    note: string
    slug: string
  }
  updatedVersions: [
    {
      id?: string
      environmentId: string
      value: string
    }
  ]
}

export interface DeleteSecretRequest {
  secretSlug: string
}

export interface DeleteSecretResponse {}

export interface RollBackSecretRequest {
  environmentSlug: string
  version: number
  secretSlug: string
}
export interface RollBackSecretResponse {
  count: string
}

export interface GetAllSecretsOfProjectRequest extends PageRequest {
  projectSlug: string
}
export interface GetAllSecretsOfProjectResponse
  extends PageResponse<{
    secret: {
      id: string
      slug: string
      name: string
      createdAt: string
      updatedAt: string
      rotateAt: string
      note: string | null
      lastUpdatedById: string
      projectId: string
      lastUpdatedBy: {
        id: string
        name: string
      }
    }
    values: {
      environment: {
        id: string
        name: string
      }
      value: string
      version: number
    }
  }> {}

export interface GetAllSecretsOfEnvironmentRequest {
  projectSlug: string
  environmentSlug: string
}
export type GetAllSecretsOfEnvironmentResponse = {
  name: string
  value: string
  isPlaintext: boolean
}[]
