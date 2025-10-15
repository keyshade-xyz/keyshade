import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { confirm, log } from '@clack/prompts'
import { handleSIGINT } from '@/util/prompt'
import { existsSync } from 'fs'
import { chmod } from 'fs/promises'
import {
  getDefaultProfileConfigurationFilePath,
  getProfileConfigurationFilePath,
  writeDefaultProfileConfig,
  writeProfileConfig
} from '@/util/configuration'

const KEY_PERMISSIONS = 0o600

export default class ResetCommand extends BaseCommand {
  getName(): string {
    return 'reset'
  }

  getDescription(): string {
    return 'Resets your local profile configurations'
  }

  getUsage(): string {
    return `keyshade reset [options]

Resets your local profile configurations stored in ~/.keyshade/default-profile.json and ~/.keyshade/profiles.json.`
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-y',
        long: '--yes',
        description: 'Skip interactive confirmation',
        defaultValue: false
      },
      {
        short: '-d',
        long: '--dry-run',
        description: 'Show what would be reset without making changes',
        defaultValue: false
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    const yes = Boolean(options.yes ?? options.Y ?? options.y)
    const dryRun = Boolean(options['dry-run'] ?? options.dryRun ?? options.d)

    if (!yes) {
      const shouldContinue = await confirm({
        message: 'This will erase all locally saved profiles. Continue? (y/N)'
      })
      handleSIGINT(shouldContinue, 'Reset cancelled!')

      if (!shouldContinue) {
        log.info('Reset cancelled. No changes were made.')
        return
      }
    }

    const targets = [
      {
        fileName: 'default-profile.json',
        displayName: 'Default profile',
        filePath: getDefaultProfileConfigurationFilePath(),
        reset: async () => {
          await writeDefaultProfileConfig(JSON.parse('{}'))
        }
      },
      {
        fileName: 'profiles.json',
        displayName: 'Profiles',
        filePath: getProfileConfigurationFilePath(),
        reset: async () => {
          await writeProfileConfig(JSON.parse('{}'))
        }
      }
    ]

    for (const target of targets) {
      const existed = existsSync(target.filePath)

      if (dryRun) {
        log.info(
          `[dry-run] Would ${existed ? 'reset' : 'create'} ${target.displayName}`
        )
        continue
      }

      try {
        await target.reset()

        if (!existed) {
          await chmod(target.filePath, KEY_PERMISSIONS)
        }

        log.info(`${existed ? 'Reset' : 'Created'} ${target.displayName}`)
      } catch (error) {
        const { message } = error as Error
        process.exitCode = 1
        throw new Error(`Failed to reset ${target.fileName}. ${message}`)
      }
    }

    if (dryRun) {
      log.success('Dry run complete. No files were modified.')
    } else {
      log.success('Local Keyshade profile files were reset successfully.')
    }
  }
}
