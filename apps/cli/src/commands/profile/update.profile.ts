import BaseCommand from '@/commands/base.command'
import { spinner } from '@clack/prompts'
import type { ProfileConfig } from '@/types/index.types'
import { fetchProfileConfig, writeProfileConfig } from '@/util/configuration'
import { checkIsDefaultProfile, checkProfileExists } from '@/util/profile'
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
        short: '-n',
        long: '--name <string>',
        description: 'New name of the profile'
      },
      {
        short: '-a',
        long: '--api-key <string>',
        description: 'New private key for the profile'
      },
      {
        short: '-b',
        long: '--base-url <string>',
        description: 'New base URL for the keyshade server'
      },
      {
        short: '-m',
        long: '--enable-metrics <boolean>',
        description: 'Enable or disable anonymous metrics collection'
      }
    ]
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    this.profiles = await fetchProfileConfig()

    const profile = args[0]
    const { name, apiKey, baseUrl, enableMetrics } = options

    const s = spinner()
    s.start('Updating the profile')

    checkProfileExists(this.profiles, profile, s)
    this.updateProfileData(
      profile,
      name as string,
      apiKey as string,
      baseUrl as string,
      enableMetrics as boolean
    )
    await writeProfileConfig(this.profiles)

    s.stop(`Profile ${profile} updated`)
  }

  private updateProfileData(
    profile: string,
    name: string,
    apiKey: string,
    baseUrl: string,
    enableMetrics: boolean
  ): void {
    const isDefaultProfile = checkIsDefaultProfile(this.profiles, profile)

    if (apiKey) {
      this.profiles[profile].apiKey = apiKey
    }

    if (baseUrl) {
      this.profiles[profile].baseUrl = baseUrl
    }

    if (enableMetrics !== undefined) {
      this.profiles[profile].metrics_enabled = enableMetrics
    }

    if (name) {
      this.profiles[name] = this.profiles[profile]
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.profiles[profile]
      if (isDefaultProfile) {
        this.profiles.default = name
      }
    }
  }
}
