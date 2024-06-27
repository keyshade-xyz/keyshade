export interface ProjectRootConfig {
  workspace: string
  project: string
  environment: string
  baseUrl?: string
}

export interface UserRootConfig {
  apiKey: string
  privateKey: string
}
