/* eslint-disable @typescript-eslint/indent */
import BaseCommand from './base.command'
import { io } from 'socket.io-client'
import { spawn } from 'child_process'
import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import {
  fetchPrivateKeyConfig,
  fetchProjectRootConfig
} from '@/util/configuration'
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

  private shouldRestart = false

  getName(): string {
    return 'run'
  }

  getDescription(): string {
    return 'Run a command'
  }

  getArguments(): CommandArgument[] {
    return [{ name: '<command>', description: 'Command to run' }]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const configurations = await this.fetchConfigurations()
    await this.checkApiKeyValidity(this.baseUrl, this.apiKey)
    await this.connectToSocket(configurations)
    await this.sleep(3000)
    await this.prefetchConfigurations()
    await this.executeCommand(args[0])
  }

  private async fetchConfigurations(): Promise<RunData> {
    const { environment, project, workspace, quitOnDecryptionFailure } =
      await fetchProjectRootConfig()
    const privateKeyConfig = await fetchPrivateKeyConfig()
    const privateKey =
      privateKeyConfig[`${workspace}_${project}_${environment}`]

    if (!privateKey) {
      throw new Error('Private key not found. Please run `keyshade init`')
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
    const host = this.baseUrl.substring(this.baseUrl.lastIndexOf('/') + 1)
    const websocketUrl = `${this.getWebsocketType(this.baseUrl)}://${host}/change-notifier`
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
        this.shouldRestart = true
      })

      ioClient.on(
        'client-registered',
        (registrationResponse: ClientRegisteredResponse) => {
          if (registrationResponse.success) {
            this.projectSlug = data.project
            this.environmentSlug = data.environment
            Logger.info('Successfully registered to API')
          } else {
            Logger.error(
              'Error registering to API: ' + registrationResponse.message
            )
            throw new Error(registrationResponse.message)
          }
        }
      )
    })
  }

  private async executeCommand(command: string) {
    let childProcess = null
    while (true) {
      if (this.shouldRestart) {
        Logger.info('Restarting command...')
        process.kill(-childProcess.pid)
        this.shouldRestart = false
      }
      if (childProcess === null) {
        childProcess = spawn(command, {
          stdio: ['inherit', 'pipe', 'pipe'],
          shell: true,
          env: this.processEnvironmentalVariables,
          detached: true
        })

        childProcess.stdout.on('data', (data) => {
          process.stdout.write(`[COMMAND] ${data}`)
        })

        childProcess.stderr.on('data', (data) => {
          process.stderr.write(`[COMMAND] ${data}`)
        })

        childProcess.on('exit', () => {
          Logger.info('Command exited.')
          childProcess = null
        })
      }
      await this.sleep(1000)
    }
  }

  private async prefetchConfigurations() {
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

    // Merge secrets and variables
    const configurations = [...secretsResponse.data, ...variablesResponse.data]
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
}
