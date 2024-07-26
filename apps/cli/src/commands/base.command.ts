import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import { fetchProfileConfig } from '@/util/configuration'
import { Logger } from '@/util/logger'
import { getDefaultProfile } from '@/util/profile'
import type { Command } from 'commander'

/**
 * The base class for all commands. All commands should extend this class.
 */
export default abstract class BaseCommand {
  // apiKey and baseUrl are protected fields that can be accessed by subclasses
  // Use these fields from the subclasses to make API requests if needed
  protected apiKey: string | null = null
  protected baseUrl: string | null = null

  readonly prepare = (program: Command): void => {
    const argsCount = this.getArguments().length

    const command = program
      .command(this.getName())
      .description(this.getDescription())
      .action(async (...data) => {
        try {
          const globalOptions = program.optsWithGlobals()
          await this.setGlobalContextFields(globalOptions)

          if (this.canMakeHttpRequests() && !this.apiKey) {
            throw new Error(
              'API key is missing. This command requires an API key. Either specify it using --api-key, or send in a profile using --profile, or set a default profile'
            )
          }

          const commandOptions = data[argsCount]
          const args: string[] = data.slice(0, argsCount)
          await this.action({ args, options: commandOptions })
        } catch (error) {
          Logger.error(error.message as string)
          process.exit(1)
        }
      })

    this.getOptions().forEach((option) =>
      command.option(
        `${option.short}, ${option.long}`,
        option.description,
        option.defaultValue
      )
    )
    this.getArguments().forEach((argument) =>
      command.argument(argument.name, argument.description)
    )

    this.getSubCommands().forEach((subCommand) => {
      subCommand.prepare(command)
    })
  }

  /**
   * The name of the command.
   */
  abstract getName(): string

  /**
   * A description of the command.
   */
  abstract getDescription(): string

  /**
   * This method is overridden by the subclasses to determine if the command can make HTTP requests.
   * If the command can make HTTP requests, return true. Otherwise, return false.
   *
   * Up the hierarchy, it is used in the `prepare` method to check if the command can make HTTP requests.
   * If it can, the global context fields should be set. If they are not set, an error is thrown.
   * @returns
   */
  canMakeHttpRequests(): boolean {
    return false
  }

  getVersion(): string {
    return null
  }

  /**
   * The options that the command accepts.
   */
  getOptions(): CommandOption[] {
    return []
  }

  /**
   * The arguments that the command accepts.
   */
  getArguments(): CommandArgument[] {
    return []
  }

  /**
   * The action that the command should take.
   * @param data The data passed to the command.
   * @param data.options The options passed to the command.
   * @param data.args The arguments passed to the command.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action({ options, args }: CommandActionData): Promise<void> | void {}

  /**
   * If the command has subcommands, return them here.
   */
  getSubCommands(): BaseCommand[] {
    return []
  }

  private async setGlobalContextFields(
    globalOptions: Record<string, string>
  ): Promise<void> {
    const profiles = await fetchProfileConfig()

    // We will either fetch the profile configuration if the --profile flag is provided
    // and the profile exists.

    // Or, we will use the API key and base URL provided in the global options, if provided.

    // If none is specified, we try to fetch the default profile configuration.

    // In case none of the above works, and/or `apiKey` and `baseUrl` are still null,
    // any of the subclasses that will need to make API requests will throw an error.
    if (globalOptions.profile) {
      if (profiles[globalOptions.profile]) {
        const profile = profiles[globalOptions.profile]

        this.apiKey = profile.apiKey
        this.baseUrl = profile.baseUrl
      } else {
        throw new Error('Profile not found')
      }
    } else if (globalOptions.apiKey || globalOptions.baseUrl) {
      if (globalOptions.apiKey) {
        this.apiKey = globalOptions.apiKey
      }
      if (globalOptions.baseUrl) {
        this.baseUrl = globalOptions.baseUrl
      }
    } else {
      const defaultProfileName = getDefaultProfile(profiles)
      const defaultProfile = profiles[defaultProfileName]

      if (defaultProfile) {
        this.apiKey = defaultProfile.apiKey
        this.baseUrl = defaultProfile.baseUrl
      }
    }
  }
}
