import BaseCommand from '@/commands/base.command'
import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import type { ProfileConfig } from '@/types/index.types'
import { fetchProfileConfig, writeProfileConfig } from '@/util/configuration'
import { intro, outro, confirm, spinner, text } from '@clack/prompts'
import { z } from 'zod'

export default class CreateProfile extends BaseCommand {
  private profiles: ProfileConfig
  private static readonly API_BASE_URL = 'https://api.keyshade.xyz'

  getName(): string {
    return 'create'
  }

  getDescription(): string {
    return 'Create a new profile'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-n',
        long: '--name <string>',
        description: 'Name of the profile'
      },
      {
        short: '-a',
        long: '--api-key <string>',
        description: 'API key for the profile'
      },
      {
        short: '-b',
        long: '--base-url <string>',
        description: 'Base URL for the keyshade server',
        defaultValue: CreateProfile.API_BASE_URL
      },
      {
        short: '',
        long: '--set-default',
        description: 'Set the profile as the default profile',
        defaultValue: false
      },
      {
        short: '-m',
        long: '--enable-metrics',
        description:
          'Should keyshade collect anonymous metrics for development?',
        defaultValue: false
      }
    ]
  }

  async action({ options }: CommandActionData): Promise<void> {
    intro('Creating a new profile')

    const { name, apiKey, baseUrl, setDefault, enableMetrics } =
      await this.parseInput(options)

    this.profiles = await fetchProfileConfig()
    await this.checkOverwriteExistingProfile(name)

    const s = spinner()
    s.start('Saving changes...')

    this.setProfileConfigData(name, apiKey, baseUrl, setDefault, enableMetrics)
    await writeProfileConfig(this.profiles)

    s.stop()
    outro(`Profile ${name} created successfully`)
  }

  private async parseInput(options: CommandActionData['options']): Promise<{
    name?: string
    apiKey?: string
    baseUrl?: string
    setDefault?: boolean
    enableMetrics?: boolean
  }> {
    let { name, apiKey, baseUrl, setDefault, enableMetrics } = options

    if (
      !name &&
      !apiKey &&
      !baseUrl &&
      setDefault == null &&
      enableMetrics == null
    ) {
      name = await text({
        message: 'Enter the name of the profile',
        placeholder: 'work'
      })

      apiKey = await text({
        message: 'Enter the API key for the profile',
        placeholder: 'ks_************'
      })

      baseUrl =
        (await text({
          message: `Enter the base URL for the keyshade server (default: ${CreateProfile.API_BASE_URL})`,
          placeholder: CreateProfile.API_BASE_URL
        })) || CreateProfile.API_BASE_URL

      setDefault = await confirm({
        message: 'Set the profile as the default profile?',
        initialValue: false
      })

      enableMetrics = await confirm({
        message: 'Should keyshade collect anonymous metrics for development?',
        initialValue: false
      })
    } else {
      if (!name) {
        name = await text({
          message: 'Enter the name of the profile',
          placeholder: 'work'
        })
      }

      if (!apiKey) {
        apiKey = await text({
          message: 'Enter the API key for the profile',
          placeholder: 'ks_************'
        })
      }
    }

    const inputSchema = z.object({
      name: z
        .string()
        .regex(
          /^[a-zA-Z0-9_-]+$/,
          'Name must contain only letters, numbers, hyphens, and underscores without spaces.'
        ),
      apiKey: z
        .string()
        .regex(
          /^ks_[a-zA-Z0-9]+$/,
          'API key must start with "ks_" and contain only letters and numbers.'
        ),
      baseUrl: z.string().url().or(z.string().length(0)).optional(),
      setDefault: z.boolean().optional(),
      enableMetrics: z.boolean().optional()
    })

    // Validate the collected data
    const parsedData = inputSchema.parse({
      name,
      apiKey,
      baseUrl,
      setDefault,
      enableMetrics
    })

    return parsedData
  }

  private async checkOverwriteExistingProfile(name: string): Promise<void> {
    if (this.profiles[name]) {
      const overwrite = await confirm({
        message: `Profile ${name} already exists. Do you want to overwrite it?`
      })

      if (!overwrite) {
        outro('Profile creation cancelled')
      }
    }
  }

  private setProfileConfigData(
    name: string,
    apiKey: string,
    baseUrl: string,
    setDefault: boolean,
    enableMetrics: boolean
  ): void {
    if (setDefault) {
      this.profiles.default = name
    }

    this.profiles[name] = {
      apiKey,
      baseUrl,
      metrics_enabled: enableMetrics
    }
  }
}
