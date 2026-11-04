/* eslint-disable @typescript-eslint/indent */
import BaseCommand from '../base.command'
import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import { ConfigurationManager } from '@/util/enhanced-configuration'
import { showSuccess, showError } from '@/util/prompt'

export default class ValidateConfigCommand extends BaseCommand {
  getName(): string {
    return 'validate'
  }

  getDescription(): string {
    return 'Validate keyshade configuration and show resolved values'
  }

  getArguments(): CommandArgument[] {
    return []
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-f',
        long: '--config-file <path>',
        description: 'Config file to validate (supports multiple)'
      },
      {
        short: '-p',
        long: '--profile <name>',
        description: 'Profile to use when validating configuration'
      },
      {
        short: '-d',
        long: '--debug-config',
        description: 'Show detailed configuration debug information'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return false
  }

  async action({ options }: CommandActionData): Promise<void> {
    try {
      const configFiles = options.configFile
        ? Array.isArray(options.configFile)
          ? options.configFile
          : [options.configFile]
        : undefined

      const manager = new ConfigurationManager({
        configFiles,
        profile: options.profile,
        debugConfig: options.debugConfig,
        noInteractive: true // Always non-interactive for validation
      })

      const config = await manager.resolveConfiguration()

      await showSuccess('Configuration is valid!')

      console.log('\nResolved Configuration:')
      console.log(`  Workspace: ${config.workspace}`)
      console.log(`  Project: ${config.project}`)
      console.log(`  Environment: ${config.environment}`)
      console.log(
        `  Quit on Decryption Failure: ${config.quitOnDecryptionFailure}`
      )

      if (config.sources.length > 1) {
        console.log('\nConfiguration Sources:')
        config.sources.forEach((source, index) => {
          console.log(`  ${index + 1}. ${source.source}: ${source.path}`)
        })
      }
    } catch (error) {
      await showError(
        `Configuration validation failed: ${error instanceof Error ? error.message : String(error)}`
      )
      process.exit(1)
    }
  }
}
