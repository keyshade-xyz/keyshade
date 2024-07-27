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

export type PrivateKeyConfig = Record<string, string>
