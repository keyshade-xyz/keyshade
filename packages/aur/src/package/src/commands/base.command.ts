import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import { fetchProfileConfig } from '@/util/configuration'
import { Logger } from '@/util/logger'
import { getDefaultProfile } from '@/util/profile'
import { Option, type Command } from 'commander'
import ControllerInstance from '@/util/controller-instance'
import { SentryInstance } from '@/util/sentry'

/**
 * The base class for all commands. All commands should extend this class.
 */
export default abstract class BaseCommand {
  // apiKey and baseUrl are protected fields that can be accessed by subclasses
  // Use these fields from the subclasses to make API requests if needed
  protected apiKey: string | null = null
  protected baseUrl: string | null = null
  protected metricsEnabled: boolean | null = null

  // Headers to be used by the API requests
  protected headers: Record<string, string> | null = null

  /**
   * Technically the entrypoint to the entire application. This function
   * is used to register the various commands across the entire CLI. The
   * function is only called from index.ts to register the commands and
   * should not be overridden.
   *
   * @param program The program to add the command to.
   */
  readonly prepare = (program: Command): void => {
    const argsCount = this.getArguments().length

    const command = program
      .command(this.getName())
      .description(this.getDescription())
      .usage(this.getUsage())
      .action(async (...data) => {
        try {
          const globalOptions = program.optsWithGlobals()
          await this.setGlobalContextFields(globalOptions)

          if (this.metricsEnabled) {
            SentryInstance.getInstance()
          }

          if (this.canMakeHttpRequests()) {
            if (!this.apiKey) {
              throw new Error(
                'API key is missing. This command requires an API key. Either specify it using --api-key, or send in a profile using --profile, or set a default profile'
              )
            }

            try {
              await ControllerInstance.getInstance().appController.health(
                this.headers
              )
            } catch {
              throw new Error(
                `Could not connect to the server: ${this.baseUrl}.`
              )
            }
          }

          const commandOptions = data[argsCount]
          const args: string[] = data.slice(0, argsCount)
          await this.action({ args, options: commandOptions })
        } catch (error) {
          const errorInfo = error as string
          Logger.error(errorInfo)
          if (this.metricsEnabled) Logger.report(errorInfo)
        }
      })

    this.getOptions().forEach((option) => {
      const newOption: Option = new Option(
        `${option.short}, ${option.long}`,
        option.description
      ).default(option.defaultValue)

      option.choices &&
        option.choices.length > 0 &&
        newOption.choices(option.choices)

      command.addOption(newOption)
    })
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
    return '1'
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
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-empty-pattern
  action({}: CommandActionData): Promise<void> | void {}

  /**
   * If the command has subcommands, return them here.
   */
  getSubCommands(): BaseCommand[] {
    return []
  }

  /**
   * Returns a string representing the usage information for the command.
   * This method should be overridden by subclasses to provide specific usage
   * instructions for each command.
   */
  getUsage(): string {
    return ''
  }

  /**
   * Logs the error
   * @param message The error message
   * @param error The error object containing details about the error
   */
  protected logError(error: {
    message: string
    error: string
    statusCode: number
  }): void {
    const { header, body } = this.extractError(error)

    Logger.error(`${header}: ${body}`)
    if (this.metricsEnabled && error?.statusCode === 500) {
      Logger.report(`${header}.\n` + JSON.stringify(error))
    }
  }

  private extractError(error: {
    message: string
    error: string
    statusCode: number
  }) {
    try {
      const { header, body } = JSON.parse(error.message) as {
        header: string
        body: string
      }
      return { header, body }
    } catch {
      return {
        header: 'Faced an error processing the request',
        body: error.message
      }
    }
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
        this.metricsEnabled = profile.metrics_enabled
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
        this.metricsEnabled = defaultProfile.metrics_enabled
      }
    }

    // Initialize the header
    this.headers = {
      'x-keyshade-token': this.apiKey
    }

    // Initialize Controller Instance
    ControllerInstance.initialize(this.baseUrl)
  }
}
