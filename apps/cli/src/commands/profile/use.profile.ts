import {
  CommandActionData,
  CommandArgument
} from 'src/types/command/command.types'
import BaseCommand from '../base.command'
import { spinner } from '@clack/prompts'
import {
  fetchProfileConfig,
  writeProfileConfig
} from '../../util/configuration'

export default class UseProfile extends BaseCommand {
  getName(): string {
    return 'use'
  }

  getDescription(): string {
    return 'Sets the default profile to use'
  }

  getArguments(): CommandArgument[] {
    return [{ name: '<profile>', description: 'Name of the profile to use' }]
  }

  async action({ args }: CommandActionData): Promise<void> {
    const profile = args[0]

    const s = spinner()
    s.start('Setting the active profile')

    const profiles = await fetchProfileConfig()

    if (!profiles[profile]) {
      s.stop(`Profile ${profile} not found`)
      return
    }

    // Set the active profile
    profiles.default = profile

    // Write the updated profiles to the configuration file
    await writeProfileConfig(profiles)

    s.stop(`Profile ${profile} is now active`)
  }
}
