import {
  CommandActionData,
  CommandArgument
} from 'src/types/command/command.types'
import BaseCommand from '../base.command'
import { confirm, spinner } from '@clack/prompts'
import {
  fetchProfileConfig,
  writeProfileConfig
} from '../../util/configuration'
import { ProfileConfig } from 'src/types/index.types'

export default class DeleteProfile extends BaseCommand {
  profiles: ProfileConfig

  getName(): string {
    return 'delete'
  }

  getDescription(): string {
    return 'Delete a profile'
  }

  getArguments(): CommandArgument[] {
    return [{ name: '<profile>', description: 'Profile to delete' }]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const profile = args[0]

    const s = spinner()
    s.start('Deleting the profile')

    this.profiles = await fetchProfileConfig()

    if (this.profileNotFound(profile)) {
      s.stop(`Profile ${profile} not found`)
      return
    }

    if (this.isDefaultProfile(profile)) {
      const choice = await confirm({
        message: 'Are you sure you want to delete the default profile?'
      })

      if (!choice) {
        s.stop(`Profile ${profile} not deleted`)
        return
      }
    }

    this.profiles[profile] = undefined

    if (this.isDefaultProfile(profile)) {
      delete this.profiles.default
    }

    await writeProfileConfig(this.profiles)

    s.stop(`Profile ${profile} deleted`)
  }

  private profileNotFound(profile: string): boolean {
    return !this.profiles[profile]
  }

  private isDefaultProfile(profile: string): boolean {
    return this.profiles.default === profile
  }
}
