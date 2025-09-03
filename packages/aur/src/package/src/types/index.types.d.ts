export interface ProjectRootConfig {
  workspace: string
  project: string
  environment: string
  quitOnDecryptionFailure: boolean
}

export interface ProfileConfig {
  default: string
  [name: string]: {
    apiKey: string
    baseUrl: string
    metrics_enabled: boolean
  }
}

export interface Page<T> {
  items: T[]
  metadata: {
    page: number
    perPage: number
    pageCount: number
    totalCount: number
    links: {
      self: string
      first: string
      previous: string | null
      next: string | null
      last: string
    }
  }
}

export type PrivateKeyConfig = Record<string, string>
