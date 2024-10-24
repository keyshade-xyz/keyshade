import { PageRequest, PageResponse } from './index.types'

export interface Secret {
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
      id?: string
      environmentId: string
      value: string
      environment: {
        id: string
        slug: string
      }
    }
  ]
}

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

export interface CreateSecretResponse extends Secret {}

export interface UpdateSecretRequest
  extends Partial<Omit<CreateSecretRequest, 'projectSlug'>> {
  secretSlug: string
}

export interface UpdateSecretResponse {
  secret: Pick<Secret, 'id' | 'name' | 'slug' | 'note'>
  updatedVersions: [
    {
      id?: string
      environmentId: string
      environment: {
        id: string
        slug: string
      }
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
    secret: Omit<Secret, 'versions' | 'project'> & {
      lastUpdatedBy: {
        id: string
        name: string
      }
    }
    values: {
      environment: {
        id: string
        name: string
        slug: string
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

export interface GetRevisionsOfSecretRequest extends Partial<PageRequest> {
  secretSlug: string
  environmentSlug: string
}

export interface GetRevisionsOfSecretResponse
  extends PageResponse<{
    id: string
    value: string
    version: number
    createdOn: string
    createdById: string
    environmentId: string
  }> {}
