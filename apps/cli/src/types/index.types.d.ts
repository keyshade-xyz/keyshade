export interface ProjectRootConfig {
  workspace: string
  project: string
  environment: string
}

export interface ProfileConfig {
  default: string
  [name: string]: {
    apiKey: string
    baseUrl: string
  }
}

export interface PrivateKeyConfig {
  // workspace_project_environment => private key
  [key: string]: string
}
