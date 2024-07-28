export interface CreateVariableRequest {
  projectId: string
  name: string
  entries: Entries[]
}
export interface Entries {
  value: string
  environmentId: string
}
export interface CreateVariableResponse {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  note: string | null
  lastUpdatedById: string
  projectId: string
  project: Project
  versions: Entries[]
}

export interface Project {
  workspaceId: string
}
export interface UpdateVariableRequest {
  variableId?: string
  name?: string
  entries?: Entries[]
}
export interface UpdateVariableResponse {
  variable: Variable
  updatedVersions: Entries[]
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
export interface RollBackVariableResponse {}
export interface DeleteVariableRequest {
  variableId: string
}
export interface DeleteVariableResponse {}
export interface getAllVariablesOfProjectRequest {
  projectId: string
}
export interface getAllVariablesOfProjectResponse {}
export interface getAllVariablesOfEnvironmentRequest {
  projectId: string
  environmentId: string
}
export interface getAllVariablesOfEnvironmentResponse {}
