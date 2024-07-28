export interface CreateVariableRequest {
  projectId: string
  name: string
  note?: string
  entries?: [
    {
      value: string
      environmentId: string
    }
  ]
}

export interface CreateVariableResponse {
  id: string
  name: string
  createdAt: string
  updatedAt: string
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
export interface UpdateVariableRequest {
  variableId: string
  name?: string
  entries?: [
    {
      value: string
      environmentId: string
    }
  ]
}
export interface UpdateVariableResponse {
  variable: Variable
  updatedVersions: [
    {
      value: string
      environmentId: string
    }
  ]
}

export interface Variable {
  id: string
  name: string
  note: string
}
export interface RollBackVariableRequest {
  variableId: string
  version: number
  environmentId: string
}

export interface RollBackVariableResponse {
  count: string
}

export interface DeleteVariableRequest {
  variableId: string
}

export interface DeleteVariableResponse {}

export interface GetAllVariablesOfProjectRequest {
  projectId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetAllVariablesOfProjectResponse {
  []
}

export interface GetAllVariablesOfEnvironmentRequest {
  projectId: string
  environmentId: string
  page?: number
  limit?: number
  sort?: string
  order?: string
  search?: string
}

export interface GetAllVariablesOfEnvironmentResponse {}
