import BaseCommand from '@/commands/base.command'
import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import { fetchProfileConfig, writeProfileConfig } from '@/util/configuration'
import { checkProfileExists } from '@/util/profile'
import { spinner } from '@clack/prompts'

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

    checkProfileExists(profiles, profile, s)

    // Set the active profile
    profiles.default = profile

    // Write the updated profiles to the configuration file
    await writeProfileConfig(profiles)

    s.stop(`Profile ${profile} is now active`)
  }
}
