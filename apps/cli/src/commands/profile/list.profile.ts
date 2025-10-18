import BaseCommand from '@/commands/base.command'
import type { ProfileConfig } from '@/types/index.types'
import {
  fetchDefaultProfileConfig,
  fetchProfileConfig
} from '@/util/configuration'
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

  async action(): Promise<void> {
    this.profiles = await fetchProfileConfig()
    const { userId: defaultProfile } = await fetchDefaultProfileConfig()

    this.printProfile(this.profiles, defaultProfile)
  }

  /**
   * Prints the profile information in a formatted table.
   *
   * @param profiles - The profile configuration object.
   * @param defaultProfile - The name of the default profile.
   */
  private printProfile(profiles: ProfileConfig, defaultProfile: string) {
    const profileKeys = Object.values(profiles)

    if (profileKeys.length === 0) {
      Logger.info('No profiles found')
      return
    }

    const headers = [
      '👤 Profile',
      '✉️ Email',
      '🌐 Base URL',
      '📊 Metrics Enabled'
    ]
    const rows = profileKeys.map((profile) => [
      `${defaultProfile === profile.user.id ? '✅' : ''} ${profile.user.name}`,
      profile.user.email,
      profile.baseUrl,
      profile.metricsEnabled ? 'Yes' : 'No'
    ])

    Table.render(headers, rows)
  }
}
