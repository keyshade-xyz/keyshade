import type {
  ProjectRootConfig,
  ConfigSource,
  ResolvedConfig,
  GlobalConfig
} from '@/types/index.types'
import { existsSync } from 'fs'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { resolve, dirname, join } from 'path'
import { Logger } from './logger'
import { text } from '@clack/prompts'

export interface ConfigurationOptions {
  workspace?: string
  project?: string
  environment?: string
  configFiles?: string[]
  profile?: string
  noInteractive?: boolean
  dryRun?: boolean
  debugConfig?: boolean
}

export class ConfigurationManager {
  private readonly debugMode: boolean
  private readonly noInteractive: boolean
  private configSources: ConfigSource[] = []

  constructor(private readonly options: ConfigurationOptions = {}) {
    this.debugMode = Boolean(options.debugConfig)
    this.noInteractive = Boolean(options.noInteractive)
  }

  /**
   * Main method to resolve configuration with all features
   */
  async resolveConfiguration(): Promise<ResolvedConfig> {
    this.configSources = []

    // Step 1: Load global configuration
    const globalConfig = await this.loadGlobalConfig()
    if (globalConfig) {
      this.configSources.push({
        path: this.getGlobalConfigPath(),
        source: 'global',
        config: globalConfig
      })
      this.debug('Loaded global configuration', globalConfig)
    }

    // Step 2: Auto-discover or load specified config files
    const configFiles = await this.resolveConfigFiles()
    for (const configFile of configFiles) {
      try {
        const fileConfig = await this.loadConfigFile(configFile)
        this.configSources.push({
          path: configFile,
          source: 'file',
          config: fileConfig
        })
        this.debug(`Loaded config file: ${configFile}`, fileConfig)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        if (this.options.configFiles?.includes(configFile)) {
          // If explicitly specified, throw error
          throw new Error(
            `Failed to load config file ${configFile}: ${errorMessage}`
          )
        }
        // If auto-discovered, continue with warning
        Logger.warn(
          `Warning: Could not load config file ${configFile}: ${errorMessage}`
        )
      }
    }

    // Step 3: Apply profile if specified
    const activeProfile = await this.resolveActiveProfile()
    if (activeProfile) {
      this.configSources.push({
        path: 'profile',
        source: 'profile',
        config: activeProfile
      })
      this.debug('Applied profile configuration', activeProfile)
    }

    // Step 4: Apply command line flags
    const flagConfig = this.extractFlagConfig()
    if (Object.keys(flagConfig).length > 0) {
      this.configSources.push({
        path: 'command-line',
        source: 'flag',
        config: flagConfig
      })
      this.debug('Applied command line flags', flagConfig)
    }

    // Step 5: Merge all configurations with precedence
    const mergedConfig = this.mergeConfigurations()
    this.debug('Merged configuration', mergedConfig)

    // Step 6: Perform environment variable interpolation
    const interpolatedConfig =
      await this.interpolateEnvironmentVariables(mergedConfig)
    this.debug('Interpolated configuration', interpolatedConfig)

    // Step 7: Validate configuration
    await this.validateConfiguration(interpolatedConfig)

    // Step 8: Handle missing required values interactively
    const finalConfig = await this.handleMissingValues(interpolatedConfig)

    const resolvedConfig: ResolvedConfig = {
      ...finalConfig,
      sources: this.configSources,
      interpolatedValues: {}
    }

    if (this.debugMode) {
      this.printConfigurationDebugInfo(resolvedConfig)
    }

    return resolvedConfig
  }

  /**
   * Auto-discover config files by searching upwards in directory tree
   */
  private async discoverConfigFiles(
    startDir = process.cwd()
  ): Promise<string[]> {
    const configFiles: string[] = []
    let currentDir = resolve(startDir)

    while (true) {
      const configPath = join(currentDir, 'keyshade.json')
      if (existsSync(configPath)) {
        configFiles.push(configPath)
        this.debug(`Found config file: ${configPath}`)
        break // Stop at first found config file
      }

      const parentDir = dirname(currentDir)
      if (parentDir === currentDir) {
        // Reached root directory
        break
      }
      currentDir = parentDir
    }

    return configFiles
  }

  /**
   * Resolve which config files to load
   */
  private async resolveConfigFiles(): Promise<string[]> {
    if (this.options.configFiles && this.options.configFiles.length > 0) {
      // Use explicitly specified config files
      return this.options.configFiles.map((file) => resolve(file))
    }

    // Auto-discover config files
    return await this.discoverConfigFiles()
  }

  /**
   * Load and parse a config file with interpolation
   */
  private async loadConfigFile(configPath: string): Promise<ProjectRootConfig> {
    if (!existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`)
    }

    const content = await readFile(configPath, 'utf8')
    return JSON.parse(content) as ProjectRootConfig
  }

  /**
   * Load global configuration from home directory
   */
  private async loadGlobalConfig(): Promise<GlobalConfig | null> {
    const globalConfigPath = this.getGlobalConfigPath()

    if (!existsSync(globalConfigPath)) {
      return null
    }

    try {
      const content = await readFile(globalConfigPath, 'utf8')
      return JSON.parse(content) as GlobalConfig
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error)
      Logger.warn(`Warning: Could not load global config: ${errorMessage}`)
      return null
    }
  }

  /**
   * Get global configuration file path
   */
  private getGlobalConfigPath(): string {
    const home =
      process.platform === 'win32' ? process.env.USERPROFILE : process.env.HOME
    return join(home, '.keyshade', 'global-config.json')
  }

  /**
   * Resolve active profile configuration
   */
  private async resolveActiveProfile(): Promise<Partial<ProjectRootConfig> | null> {
    if (!this.options.profile) {
      return null
    }

    // Find profile in any loaded config file
    for (const source of this.configSources) {
      if (source.config.profiles?.[this.options.profile]) {
        return source.config.profiles[this.options.profile]
      }
    }

    throw new Error(
      `Profile '${this.options.profile}' not found in any configuration file`
    )
  }

  /**
   * Extract configuration from command line flags
   */
  private extractFlagConfig(): Partial<ProjectRootConfig> {
    const config: Partial<ProjectRootConfig> = {}

    if (this.options.workspace) config.workspace = this.options.workspace
    if (this.options.project) config.project = this.options.project
    if (this.options.environment) config.environment = this.options.environment

    return config
  }

  /**
   * Merge configurations with proper precedence
   * Order: global < file < profile < flags (highest precedence)
   */
  private mergeConfigurations(): Partial<ProjectRootConfig> {
    let merged: Partial<ProjectRootConfig> = {}

    // Apply in precedence order
    for (const source of this.configSources) {
      merged = { ...merged, ...source.config }
    }

    return merged
  }

  /**
   * Interpolate environment variables in configuration values
   */
  private async interpolateEnvironmentVariables(
    config: Partial<ProjectRootConfig>
  ): Promise<Partial<ProjectRootConfig>> {
    const interpolated = { ...config }
    const interpolationPattern = /\$\{([^}]+)\}/g

    for (const [key, value] of Object.entries(interpolated)) {
      if (typeof value === 'string') {
        const interpolatedValue = value.replace(
          interpolationPattern,
          (match, envVar) => {
            const envValue = process.env[envVar]
            if (envValue === undefined) {
              throw new Error(
                `Environment variable '${envVar}' used in ${key} is not defined. ` +
                  `Please set ${envVar} or update your configuration.`
              )
            }
            return envValue
          }
        )

        if (interpolatedValue !== value) {
          this.debug(`Interpolated ${key}: ${value} -> ${interpolatedValue}`)
          interpolated[key] = interpolatedValue
        }
      }
    }

    return interpolated
  }

  /**
   * Validate configuration completeness and correctness
   */
  private async validateConfiguration(
    config: Partial<ProjectRootConfig>
  ): Promise<void> {
    const errors: string[] = []

    // Required fields validation
    if (!config.workspace) {
      errors.push('workspace is required')
    }
    if (!config.project) {
      errors.push('project is required')
    }
    if (!config.environment) {
      errors.push('environment is required')
    }

    // Field format validation
    if (config.workspace && !/^[a-zA-Z0-9_-]+$/.test(config.workspace)) {
      errors.push(
        'workspace must contain only alphanumeric characters, hyphens, and underscores'
      )
    }
    if (config.project && !/^[a-zA-Z0-9_-]+$/.test(config.project)) {
      errors.push(
        'project must contain only alphanumeric characters, hyphens, and underscores'
      )
    }
    if (config.environment && !/^[a-zA-Z0-9_-]+$/.test(config.environment)) {
      errors.push(
        'environment must contain only alphanumeric characters, hyphens, and underscores'
      )
    }

    if (errors.length > 0) {
      throw new Error(
        `Configuration validation failed:\n- ${errors.join('\n- ')}`
      )
    }
  }

  /**
   * Handle missing required values through interactive prompts
   */
  private async handleMissingValues(
    config: Partial<ProjectRootConfig>
  ): Promise<ProjectRootConfig> {
    if (this.noInteractive) {
      // In non-interactive mode, ensure all required values are present
      const missing = []
      if (!config.workspace) missing.push('workspace')
      if (!config.project) missing.push('project')
      if (!config.environment) missing.push('environment')

      if (missing.length > 0) {
        throw new Error(
          `Missing required configuration values in non-interactive mode: ${missing.join(', ')}. ` +
            'Please provide these values via command line flags or configuration files.'
        )
      }
    } else {
      // Interactive mode: prompt for missing values
      if (!config.workspace) {
        config.workspace = (await text({
          message: 'Enter workspace slug:',
          placeholder: 'my-workspace',
          validate: (value) => {
            if (!value) return 'Workspace is required'
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
              return 'Workspace must contain only alphanumeric characters, hyphens, and underscores'
            }
            return undefined
          }
        })) as string
      }

      if (!config.project) {
        config.project = (await text({
          message: 'Enter project slug:',
          placeholder: 'my-project',
          validate: (value) => {
            if (!value) return 'Project is required'
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
              return 'Project must contain only alphanumeric characters, hyphens, and underscores'
            }
            return undefined
          }
        })) as string
      }

      if (!config.environment) {
        config.environment = (await text({
          message: 'Enter environment slug:',
          placeholder: 'development',
          validate: (value) => {
            if (!value) return 'Environment is required'
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
              return 'Environment must contain only alphanumeric characters, hyphens, and underscores'
            }
            return undefined
          }
        })) as string
      }
    }

    return {
      workspace: config.workspace,
      project: config.project,
      environment: config.environment,
      quitOnDecryptionFailure: config.quitOnDecryptionFailure ?? false
    }
  }

  /**
   * Print debug information about configuration resolution
   */
  private printConfigurationDebugInfo(config: ResolvedConfig): void {
    console.log('\n=== Configuration Debug Information ===')
    console.log('\nConfiguration Sources (in order of precedence):')

    this.configSources.forEach((source, index) => {
      console.log(
        `${index + 1}. ${source.source.toUpperCase()} (${source.path})`
      )
      console.log(
        `   ${JSON.stringify(source.config, null, 2).replace(/\n/g, '\n   ')}`
      )
    })

    console.log('\nFinal Resolved Configuration:')
    const { sources, interpolatedValues, ...finalConfig } = config
    console.log(
      `   ${JSON.stringify(finalConfig, null, 2).replace(/\n/g, '\n   ')}`
    )

    if (Object.keys(interpolatedValues).length > 0) {
      console.log('\nInterpolated Values:')
      console.log(
        `   ${JSON.stringify(interpolatedValues, null, 2).replace(/\n/g, '\n   ')}`
      )
    }
    console.log('=====================================\n')
  }

  /**
   * Create global configuration file
   */
  async createGlobalConfig(config: GlobalConfig): Promise<void> {
    const globalConfigPath = this.getGlobalConfigPath()
    await this.ensureDirectoryExists(globalConfigPath)
    await writeFile(globalConfigPath, JSON.stringify(config, null, 2), 'utf8')
    Logger.info(`Global configuration saved to ${globalConfigPath}`)
  }

  /**
   * Generate configuration template
   */
  generateConfigTemplate(templateType = 'default'): ProjectRootConfig {
    const templates = {
      default: {
        workspace: '$' + '{KEYSHADE_WORKSPACE}',
        project: '$' + '{KEYSHADE_PROJECT}',
        environment: '$' + '{KEYSHADE_ENVIRONMENT:-development}',
        quitOnDecryptionFailure: false
      },
      production: {
        workspace: '$' + '{KEYSHADE_WORKSPACE}',
        project: '$' + '{KEYSHADE_PROJECT}',
        environment: 'production',
        quitOnDecryptionFailure: true
      },
      'multi-profile': {
        workspace: '$' + '{KEYSHADE_WORKSPACE}',
        project: '$' + '{KEYSHADE_PROJECT}',
        environment: 'development',
        quitOnDecryptionFailure: false,
        profiles: {
          dev: {
            environment: 'development',
            quitOnDecryptionFailure: false
          },
          staging: {
            environment: 'staging',
            quitOnDecryptionFailure: true
          },
          prod: {
            environment: 'production',
            quitOnDecryptionFailure: true
          }
        }
      }
    }

    return templates[templateType] || templates.default
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(filePath: string): Promise<void> {
    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }
  }

  /**
   * Debug logging helper
   */
  private debug(message: string, data?: any): void {
    if (this.debugMode) {
      Logger.info(`[CONFIG DEBUG] ${message}`)
      if (data) {
        console.log(JSON.stringify(data, null, 2))
      }
    }
  }
}

// Legacy compatibility functions
export const fetchProjectRootConfig = async (): Promise<ProjectRootConfig> => {
  const manager = new ConfigurationManager()
  const resolved = await manager.resolveConfiguration()
  return {
    workspace: resolved.workspace,
    project: resolved.project,
    environment: resolved.environment,
    quitOnDecryptionFailure: resolved.quitOnDecryptionFailure
  }
}

export const fetchProjectRootConfigFromPath = async (
  configPath: string
): Promise<ProjectRootConfig> => {
  const manager = new ConfigurationManager({ configFiles: [configPath] })
  const resolved = await manager.resolveConfiguration()
  return {
    workspace: resolved.workspace,
    project: resolved.project,
    environment: resolved.environment,
    quitOnDecryptionFailure: resolved.quitOnDecryptionFailure
  }
}

// Re-export all other functions from the original configuration module
export * from './configuration'
