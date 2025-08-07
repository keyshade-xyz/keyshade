/* eslint-disable @typescript-eslint/indent */
import BaseCommand from './base.command'
import { io } from 'socket.io-client'
import { spawn } from 'child_process'
import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import { fetchPrivateKey, fetchProjectRootConfig } from '@/util/configuration'
import { Logger } from '@/util/logger'
import type {
  ClientRegisteredResponse,
  Configuration,
  RunData
} from '@/types/command/run.types'

import { decrypt } from '@/util/decrypt'

import { SecretController, VariableController } from '@keyshade/api-client'

export default class RunCommand extends BaseCommand {
  private processEnvironmentalVariables = {}

  private projectSlug: string
  private environmentSlug: string
  private readonly command: string

  private childProcess = null

  getName(): string {
    return 'run'
  }

  getDescription(): string {
    return 'Run a command'
  }

  getArguments(): CommandArgument[] {
    return [{ name: '<command...>', description: 'Command to run' }]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--environment <slug>',
        description: 'Environment to configure'
      }
    ]
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    // Join all arguments to form the complete command
    if (args.length === 0) {
      throw new Error('No command provided')
    }

    // @ts-expect-error -- false positive, might be an error on commander.js
    // args return string[][] instead of string[]
    this.command = args[0].join(' ')

    const configurations = await this.fetchConfigurations()

    // If the user passed in an environment, override the one in our configurations object
    if (options.environment) {
      configurations.environment = options.environment
    }

    await this.checkApiKeyValidity(this.baseUrl, this.apiKey)
    await this.connectToSocket(configurations)
    await this.sleep(3000)
    await this.prefetchConfigurations(configurations.privateKey)
    this.spawnCommand()

    process.on('SIGINT', () => {
      this.killCommand()
      process.exit(0)
    })
  }

  private async fetchConfigurations(): Promise<RunData> {
    const { environment, project, workspace, quitOnDecryptionFailure } =
      await fetchProjectRootConfig()
    const privateKey = await fetchPrivateKey(project)

    if (!privateKey) {
      throw new Error(
        'Private key not found for this project. Please run `keyshade init` or `keyshade config private-key add` to add a private key.'
      )
    }

    return {
      environment,
      project,
      workspace,
      privateKey,
      quitOnDecryptionFailure
    }
  }

  private getWebsocketType(baseUrl: string) {
    if (baseUrl.startsWith('https')) {
      return 'wss'
    }
    return 'ws'
  }

  private async connectToSocket(data: RunData) {
    Logger.info('Connecting to socket...')
    // Fix: Parse the full host from baseUrl, not just the last segment
    const url = new URL(this.baseUrl)
    const websocketUrl = `${this.getWebsocketType(this.baseUrl)}://${url.host}/change-notifier`
    const privateKey = data.privateKey
    const quitOnDecryptionFailure = data.quitOnDecryptionFailure

    const ioClient = io(websocketUrl, {
      autoConnect: false,
      extraHeaders: {
        'x-keyshade-token': this.apiKey
      },
      transports: ['websocket']
    })

    ioClient.connect()
    ioClient.on('connect', async () => {
      ioClient.emit('register-client-app', {
        workspaceSlug: data.workspace,
        projectSlug: data.project,
        environmentSlug: data.environment
      })

      ioClient.on('configuration-updated', async (data: Configuration) => {
        Logger.info(
          `Configuration change received from API (name: ${data.name})`
        )

        if (!data.isPlaintext) {
          try {
            data.value = await decrypt(privateKey, data.value)
          } catch (error) {
            if (quitOnDecryptionFailure) {
              Logger.error(
                `Decryption failed for ${data.name}. Stopping the process.`
              )
              process.exit(1)
            } else {
              Logger.warn(
                `Decryption failed for ${data.name}. Skipping this configuration.`
              )
              return
            }
          }
        }

        this.processEnvironmentalVariables[data.name] = data.value
        this.restartCommand()
      })
      // Set a timeout for registration response
      const registrationTimeout = setTimeout(() => {
        Logger.error(
          'Connection timeout: No response from server after 30 seconds'
        )
        process.exit(1)
      }, 30000)

      ioClient.on(
        'client-registered',
        (registrationResponse: ClientRegisteredResponse) => {
          clearTimeout(registrationTimeout)
          if (registrationResponse.success) {
            this.projectSlug = data.project
            this.environmentSlug = data.environment
            Logger.info('Successfully registered to API')
          } else {
            // Extract meaningful error message
            let errorMessage = 'Unknown error'

            if (typeof registrationResponse.message === 'string') {
              // If it is just a string, use it directly
              errorMessage = registrationResponse.message
            } else if (
              typeof registrationResponse.message === 'object' &&
              registrationResponse.message !== null
            ) {
              // If the message is an object and not null
              // Attempt to parse the message if it's a JSON string
              // Handle nested error structure
              const msgObj = registrationResponse.message as any
              const nestedMessage = msgObj.response?.message || msgObj.message // Fallback to message if response is not available

              if (typeof nestedMessage === 'string') {
                try {
                  const parsed = JSON.parse(nestedMessage)
                  if (parsed.header && parsed.body) {
                    errorMessage = `${parsed.header}: ${parsed.body}`
                  } else {
                    errorMessage = nestedMessage
                  }
                } catch {
                  // If parsing fails, fallback to string representation
                  errorMessage = nestedMessage
                }
              } else {
                // If the message is not a string, stringify it
                errorMessage = JSON.stringify(msgObj)
              }
            } else {
              // Handle other types (undefined, null, etc.)
              errorMessage = String(registrationResponse.message)
            }

            Logger.error(`Error registering to API: ${errorMessage}`)
            process.exit(1)
          }
        }
      )
    })
  }

  private async prefetchConfigurations(privateKey: string) {
    Logger.info('Prefetching configurations...')
    const secretController = new SecretController(this.baseUrl)
    const variableController = new VariableController(this.baseUrl)

    const secretsResponse = await secretController.getAllSecretsOfEnvironment(
      {
        environmentSlug: this.environmentSlug,
        projectSlug: this.projectSlug
      },
      {
        'x-keyshade-token': this.apiKey
      }
    )

    if (!secretsResponse.success) {
      throw new Error(secretsResponse.error.message)
    }

    const variablesResponse =
      await variableController.getAllVariablesOfEnvironment(
        {
          environmentSlug: this.environmentSlug,
          projectSlug: this.projectSlug
        },
        {
          'x-keyshade-token': this.apiKey
        }
      )

    if (!variablesResponse.success) {
      throw new Error(variablesResponse.error.message)
    }

    // Decrypt secrets if not already decrypted
    const decryptedSecrets: Array<Omit<Configuration, 'isPlaintext'>> = []
    for (const secret of secretsResponse.data) {
      const decryptedValue = await decrypt(privateKey, secret.value)
      decryptedSecrets.push({
        name: secret.name,
        value: decryptedValue
      })
    }

    // Merge secrets and variables
    const configurations = [...decryptedSecrets, ...variablesResponse.data]
    Logger.info(
      `Fetched ${configurations.length} configurations (${secretsResponse.data.length} secrets, ${variablesResponse.data.length} variables)`
    )

    // Set the configurations as environmental variables
    configurations.forEach((config) => {
      this.processEnvironmentalVariables[config.name] = config.value
    })
  }

  private async sleep(ms: number) {
    return await new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }

  private async checkApiKeyValidity(
    baseUrl: string,
    apiKey: string
  ): Promise<void> {
    Logger.info('Checking API key validity...')
    const response = await fetch(`${baseUrl}/api/api-key/access/live-updates`, {
      headers: {
        'x-keyshade-token': apiKey
      }
    })

    if (!response.ok) {
      throw new Error(
        'API key is not valid. Please check the key and try again.'
      )
    }

    Logger.info('API key is valid!')
  }

  private spawnCommand() {
    this.childProcess = spawn(this.command, {
      // @ts-expect-error this just works
      stdio: 'inherit',
      shell: true,
      env: {
        ...process.env,
        ...this.processEnvironmentalVariables
      }
    })

    this.childProcess.on('exit', (code: number | null) => {
      // Code is 0 only if the command exits on its own
      if (code === 0) {
        Logger.info('Command exited successfully!')
        process.exit(1)
      }
    })
  }

  private restartCommand() {
    this.killCommand()
    this.spawnCommand()
  }

  private killCommand() {
    if (this.childProcess !== null) {
      process.kill(-this.childProcess.pid, 'SIGKILL')
    }
  }
}
