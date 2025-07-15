import BaseCommand from '@/commands/base.command'
import { getDefaultProfile } from '@/util/profile'
import type { ProfileConfig } from '@/types/index.types'
import { fetchProfileConfig } from '@/util/configuration'
import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import { Table } from '@/util/table'
import { Logger } from '@/util/logger'

export default class ListProfile extends BaseCommand {
  private profiles: ProfileConfig

  getName(): string {
    return 'list'
  }

  getDescription(): string {
    return 'List all profiles'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-v',
        long: '--verbose',
        description: 'Prints everything',
        defaultValue: false
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    const { verbose } = options
    this.profiles = await fetchProfileConfig()
    const defaultProfile = getDefaultProfile(this.profiles)
    delete this.profiles.default

    this.printProfile(this.profiles, defaultProfile, verbose as boolean)
  }

  /**
   * Prints the profile information in a formatted table.
   *
   * @param profiles - The profile configuration object.
   * @param defaultProfile - The name of the default profile.
   * @param verbose - A boolean indicating whether to display additional information.
   */
  private printProfile(
    profiles: ProfileConfig,
    defaultProfile: string,
    verbose: boolean
  ) {
    const profileKeys = Object.keys(profiles)

    if (profileKeys.length === 0) {
      Logger.info('No profiles found')
      return
    }

    if (verbose) {
      const headers = [
        '👤 Profile',
        '🔑 API Key',
        '🌐 Base URL',
        '📊 Metrics Enabled'
      ]
      const rows = profileKeys.map((profile) => [
        defaultProfile === profile ? `✔️ ${profile}` : profile,
        profiles[profile].apiKey,
        profiles[profile].baseUrl,
        profiles[profile].metrics_enabled ? 'Yes' : 'No'
      ])

      Table.render(headers, rows)
    } else {
      const headers = ['👤 Profile']
      const rows = profileKeys.map((profile) => [
        defaultProfile === profile ? `✔️ ${profile}` : profile
      ])

      Table.render(headers, rows)
    }
  }
}
