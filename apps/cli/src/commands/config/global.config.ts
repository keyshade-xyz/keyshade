/* eslint-disable @typescript-eslint/indent */
import BaseCommand from '../base.command'
import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import { ConfigurationManager } from '@/util/enhanced-configuration'
import { text, confirm } from '@clack/prompts'
import { showSuccess, showError } from '@/util/prompt'

export default class GlobalConfigCommand extends BaseCommand {
  getName(): string {
    return 'global'
  }

  getDescription(): string {
    return 'Manage global keyshade configuration defaults'
  }

  getArguments(): CommandArgument[] {
    return []
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-s',
        long: '--set',
        description: 'Set global configuration interactively'
      },
      {
        short: '-c',
        long: '--clear',
        description: 'Clear global configuration'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return false
  }

  async action({ options }: CommandActionData): Promise<void> {
    if (options.clear) {
      await this.handleClear()
    } else {
      await this.handleSet()
    }
  }

  private async handleSet(): Promise<void> {
    try {
      console.log('Setting up global configuration...\n')

      const workspace = (await text({
        message: 'Default workspace (optional):',
        placeholder: 'Leave empty for no default',
        validate: (value) => {
          if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
            return 'Workspace must contain only alphanumeric characters, hyphens, and underscores'
          }
          return undefined
        }
      })) as string

      const project = (await text({
        message: 'Default project (optional):',
        placeholder: 'Leave empty for no default',
        validate: (value) => {
          if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
            return 'Project must contain only alphanumeric characters, hyphens, and underscores'
          }
          return undefined
        }
      })) as string

      const environment = (await text({
        message: 'Default environment (optional):',
        placeholder: 'Leave empty for no default',
        validate: (value) => {
          if (value && !/^[a-zA-Z0-9_-]+$/.test(value)) {
            return 'Environment must contain only alphanumeric characters, hyphens, and underscores'
          }
          return undefined
        }
      })) as string

      const quitOnFailure = (await confirm({
        message: 'Quit on decryption failure by default?'
      })) as boolean

      const globalConfig: any = {}
      if (workspace) globalConfig.workspace = workspace
      if (project) globalConfig.project = project
      if (environment) globalConfig.environment = environment
      globalConfig.quitOnDecryptionFailure = quitOnFailure

      const manager = new ConfigurationManager()
      await manager.createGlobalConfig(globalConfig)

      await showSuccess('Global configuration saved successfully!')

      console.log(
        '\nGlobal configuration will be used as defaults for all projects.'
      )
      console.log('Local project configurations will override these values.')
    } catch (error) {
      await showError(
        `Failed to set global configuration: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private async handleClear(): Promise<void> {
    try {
      const confirmClear = (await confirm({
        message: 'Are you sure you want to clear the global configuration?'
      })) as boolean

      if (!confirmClear) {
        console.log('Clear operation cancelled.')
        return
      }

      const manager = new ConfigurationManager()
      await manager.createGlobalConfig({})

      await showSuccess('Global configuration cleared successfully!')
    } catch (error) {
      await showError(
        `Failed to clear global configuration: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
