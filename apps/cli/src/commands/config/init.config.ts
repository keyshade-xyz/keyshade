/* eslint-disable @typescript-eslint/indent */
import BaseCommand from '../base.command'
import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import { ConfigurationManager } from '@/util/enhanced-configuration'
import { writeFile } from 'fs/promises'
import { select, confirm } from '@clack/prompts'
import { showSuccess, showError } from '@/util/prompt'

export default class InitConfigCommand extends BaseCommand {
  getName(): string {
    return 'init'
  }

  getDescription(): string {
    return 'Initialize a new keyshade configuration file with templates'
  }

  getArguments(): CommandArgument[] {
    return []
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-t',
        long: '--template <type>',
        description: 'Template type: default, production, multi-profile'
      },
      {
        short: '-o',
        long: '--output <path>',
        description: 'Output path (default: ./keyshade.json)'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return false
  }

  async action({ options }: CommandActionData): Promise<void> {
    let templateType = options.template || 'default'
    const outputPath = options.output || './keyshade.json'

    // If no template specified, ask user
    if (!options.template) {
      templateType = (await select({
        message: 'Choose a configuration template:',
        options: [
          {
            value: 'default',
            label: 'Default - Basic configuration with environment variables'
          },
          {
            value: 'production',
            label: 'Production - Production-ready with strict settings'
          },
          {
            value: 'multi-profile',
            label: 'Multi-Profile - Multiple environments (dev, staging, prod)'
          }
        ]
      })) as string
    }

    // Check if file already exists
    try {
      const { existsSync } = await import('fs')
      if (existsSync(outputPath)) {
        const overwrite = await confirm({
          message: `Configuration file already exists at ${outputPath}. Overwrite?`
        })

        if (!overwrite) {
          await showError('Configuration initialization cancelled.')
          return
        }
      }
    } catch {
      // File doesn't exist, continue
    }

    const manager = new ConfigurationManager()
    const template = manager.generateConfigTemplate(templateType)

    try {
      await writeFile(outputPath, JSON.stringify(template, null, 2), 'utf8')
      await showSuccess(`Configuration template created at ${outputPath}`)

      console.log('\nNext steps:')
      console.log(
        '1. Update the configuration values with your actual workspace, project, and environment'
      )
      console.log(
        '2. Set up environment variables if using interpolation ($' +
          '{ENVVAR} syntax)'
      )
      console.log(
        '3. Run `keyshade config validate` to verify your configuration'
      )
      console.log('4. Run `keyshade run <command>` to test your setup')

      if (templateType === 'multi-profile') {
        console.log('\nProfile usage:')
        console.log(
          '- Use `keyshade run --profile dev <command>` for development'
        )
        console.log(
          '- Use `keyshade run --profile staging <command>` for staging'
        )
        console.log(
          '- Use `keyshade run --profile prod <command>` for production'
        )
      }
    } catch (error) {
      await showError(
        `Failed to create configuration file: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}
