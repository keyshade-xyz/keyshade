import BaseCommand from '@/commands/base.command'
import { getDefaultProfile } from '@/util/profile'
import type { ProfileConfig } from '@/types/index.types'
import { fetchProfileConfig } from '@/util/configuration'
import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import Table from 'cli-table'
// import * as colors from 'colors'

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
    const table = new Table({
      chars: {
        top: '═',
        'top-mid': '╤',
        'top-left': '╔',
        'top-right': '╗',
        bottom: '═',
        'bottom-mid': '╧',
        'bottom-left': '╚',
        'bottom-right': '╝',
        left: '║',
        'left-mid': '╟',
        mid: '─',
        'mid-mid': '┼',
        right: '║',
        'right-mid': '╢',
        middle: '│'
      }
    })

    if (verbose) {
      const profileList = []
      Object.keys(profiles).forEach((profile) => {
        profileList.push([
          `${defaultProfile === profile ? `${profile} (default)` : profile}`,
          `${profiles[profile].apiKey}`,
          `${profiles[profile].baseUrl}`,
          `${profiles[profile].metrics_enabled ? 'Yes' : 'No'}`
        ])
      })
      table.push(
        ['Profile', 'API Key', 'Base URL', 'Metrics Enabled'],
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        ...profileList
      )
    } else {
      const profileList = []
      Object.keys(profiles).forEach((profile) => {
        profileList.push([
          `${defaultProfile === profile ? `${profile} (default)` : profile}`
        ])
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      table.push(['Profile'], ...profileList)
    }

    console.log(table.toString())
  }
}
