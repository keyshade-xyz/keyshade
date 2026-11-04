export interface ProjectRootConfig {
  workspace: string
  project: string
  environment: string
  quitOnDecryptionFailure: boolean
  profiles?: Record<string, Partial<ProjectRootConfig>>
}

export interface GlobalConfig extends Partial<ProjectRootConfig> {
  // Global configuration that can be overridden by project configs
}

export interface ConfigSource {
  path: string
  source: 'file' | 'flag' | 'env' | 'interactive' | 'global' | 'profile'
  config: Partial<ProjectRootConfig>
}

export interface ResolvedConfig extends ProjectRootConfig {
  sources: ConfigSource[]
  interpolatedValues: Record<string, string>
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
