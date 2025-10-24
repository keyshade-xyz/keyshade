export interface ProjectRootConfig {
  workspace: string
  project: string
  environment: string
  quitOnDecryptionFailure: boolean
}

export interface ProfileConfig
  extends Record<
    string,
    {
      user: {
        id: string
        name: string | null
        email: string
      }
      token: string
      sessionId: string
      baseUrl: string
      metricsEnabled: boolean
    }
  > {}

export interface PrivateKeyConfig extends Record<string, string> {}

export interface DefaultProfileConfig {
  userId: string
}
