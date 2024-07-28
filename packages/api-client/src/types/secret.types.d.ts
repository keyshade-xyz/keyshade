export interface CreateSecretRequest {
  projectId: string
  name: string
  note?: string
  rotateAfter?: string
  entries?: [
    {
      value: string
      environmentId: string
    }
  ]
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
  secretId: string
  name?: string
  note?: string
  rotateAfter?: string
  entries?: [
    {
      value: string
      environmentId: string
    }
  ]
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
export interface RollBackSecretResponse {
  count: string
}

export interface GetAllSecretsOfProjectRequest {
  projectId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}
export interface GetAllSecretsOfProjectResponse {
  items: {
    id: string
    name: string
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
  }[]
}

export interface GetAllSecretsOfEnvironmentRequest {
  projectId: string
  environmentId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}
export interface GetAllSecretsOfEnvironmentResponse {
  items: {
    id: string
    name: string
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
  }[]
}
