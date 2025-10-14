import BaseCommand from '@/commands/base.command'
import { spinner } from '@clack/prompts'
import type { ProfileConfig } from '@/types/index.types'
import { fetchProfileConfig, writeProfileConfig } from '@/util/configuration'
import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'

export default class UpdateProfile extends BaseCommand {
  private profiles: ProfileConfig

  getName(): string {
    return 'update'
  }

  getDescription(): string {
    return 'Update a profile'
  }

  getArguments(): CommandArgument[] {
    return [{ name: '<profile>', description: 'Name of the profile to update' }]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-b',
        long: '--base-url <string>',
        description: 'New base URL for the keyshade server'
      },
      {
        short: '-m',
        long: '--enable-metrics <boolean>',
        description:
          'Should keyshade collect anonymous metrics for development?'
      }
    ]
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    this.profiles = await fetchProfileConfig()

    const profile = args[0]
    const { baseUrl, enableMetrics } = options

    const s = spinner()
    s.start('Updating the profile')

    this.updateProfileData(profile, baseUrl as string, enableMetrics as boolean)
    await writeProfileConfig(this.profiles)

    s.stop(`Profile ${profile} updated`)
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  private updateProfileData(
    profile: string,
    baseUrl: string,
    enableMetrics: boolean
  ): void {
    if (baseUrl) {
      this.profiles[profile].baseUrl = baseUrl
    }

    if (enableMetrics !== undefined) {
      this.profiles[profile].metricsEnabled = enableMetrics
    }
  }
}
