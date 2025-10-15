import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '@/commands/base.command'
import { confirm, log } from '@clack/prompts'
import { handleSIGINT } from '@/util/prompt'
import os from 'os'
import path from 'path'
import { access, chmod, mkdir, writeFile } from 'fs/promises'
import { constants } from 'fs'

const KEY_PERMISSIONS = 0o600

export default class ResetCommand extends BaseCommand {
  getName(): string {
    return 'reset'
  }

  getDescription(): string {
    return 'Reset local Keyshade CLI profiles to empty objects'
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

    const homeDirectory = os.homedir()
    const keyshadeDirectory = path.join(homeDirectory, '.keyshade')
    const targets = [
      {
        fileName: 'default-profile.json',
        displayName: 'Default profile',
        filePath: path.join(keyshadeDirectory, 'default-profile.json')
      },
      {
        fileName: 'profiles.json',
        displayName: 'Profiles',
        filePath: path.join(keyshadeDirectory, 'profiles.json')
      }
    ]

    if (!dryRun) {
      await this.ensureDirectory(keyshadeDirectory)
    }

    for (const target of targets) {
      const exists = await this.fileExists(target.filePath)

      if (dryRun) {
        log.info(
          `[dry-run] Would ${exists ? 'reset' : 'create'} ${target.displayName}`
        )
        continue
      }

      try {
        if (exists) {
          await this.writeResetFile(target.filePath)
          log.info(`Reset ${target.displayName}`)
        } else {
          await this.createResetFile(target.filePath)
          log.info(`Created ${target.displayName}`)
        }
      } catch (error) {
        const { message } = error as Error
        process.exitCode = 1
        throw new Error(
          `Failed to reset ${target.fileName}. ${message}. See --verbose for more info.`
        )
      }
    }

    if (dryRun) {
      log.success('Dry run complete. No files were modified.')
    } else {
      log.success('Local Keyshade profile files were reset successfully.')
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK)
      return true
    } catch {
      return false
    }
  }

  private async ensureDirectory(directory: string): Promise<void> {
    await mkdir(directory, { recursive: true })
  }

  private async writeResetFile(filePath: string): Promise<void> {
    await writeFile(filePath, '{}\n', { encoding: 'utf8' })
  }

  private async createResetFile(filePath: string): Promise<void> {
    await writeFile(filePath, '{}\n', {
      encoding: 'utf8',
      mode: KEY_PERMISSIONS
    })
    await chmod(filePath, KEY_PERMISSIONS)
  }
}
