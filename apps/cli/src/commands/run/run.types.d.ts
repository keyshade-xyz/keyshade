export interface Configuration {
  name: string
  value: string
  isPlaintext: boolean
}

export interface ClientRegisteredResponse {
  workspaceId: string
  projectId: string
  environmentId: string
}
