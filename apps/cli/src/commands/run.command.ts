/* eslint-disable @typescript-eslint/indent */
import BaseCommand from './base.command'
import { io } from 'socket.io-client'
import { spawn } from 'child_process'
import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import {
  fetchPrivateKey,
  fetchProjectRootConfig,
  writeProjectRootConfig
} from '@/util/configuration'
import { Logger } from '@/util/logger'
import type {
  ClientRegisteredResponse,
  Configuration,
  RunData
} from '@/types/command/run.types'

import { type ProjectRootConfig } from '@/types/index.types'

import { decrypt } from '@/util/decrypt'

import { SecretController, VariableController } from '@keyshade/api-client'

// TODO: Add optional --environment flag

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
        long: '--environment-slug <string>',
        description: 'Environment slug to configure'
      }
    ]
  }

  // Pulled code from update.config.ts
  async updateEnvironmentConfig(options: Record<string, any>): Promise<void> {
    // Check if keyshade.json is present
    const projectRootConfig = await fetchProjectRootConfig()

    // Parse input
    const updatedConfig = await this.parseInput(options, projectRootConfig)

    // Update keyshade.json
    await writeProjectRootConfig(updatedConfig)

    Logger.info('Configuration updated successfully! Current configuration:')
    Object.entries(updatedConfig).forEach(([key, value]) => {
      Logger.info(`  | ${key}: ${value}`)
    })
  }

  // Pulled this from update.config.ts
  private async parseInput(
    options: CommandActionData['options'],
    projectRootConfig: ProjectRootConfig
  ): Promise<ProjectRootConfig> {
    return {
      workspace: options.workspace || projectRootConfig.workspace,
      project: options.project || projectRootConfig.project,
      environment: options.environment || projectRootConfig.environment,
      quitOnDecryptionFailure:
        options.quitOnDecryptionFailure ||
        projectRootConfig.quitOnDecryptionFailure
    }
  }

  async action({ options, args }: CommandActionData): Promise<void> {
    // Join all arguments to form the complete command
    if (args.length === 0) {
      throw new Error('No command provided')
    }

    console.log('environment slug: ', options.environmentSlug)
    // TODO: Verify environment exists?

    // TODO: Change environment slug in keyshade.json.
    if (options.environmentSlug) {
      await this.updateEnvironmentConfig({
        environment: options.environmentSlug
      })
    }

    // TODO: Update documentation.

    // @ts-expect-error -- false positive, might be an error on commander.js
    // args return string[][] instead of string[]
    this.command = args[0].join(' ')

    const configurations = await this.fetchConfigurations()
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
        this.restartCommand()
      })

      ioClient.on(
        'client-registered',
        (registrationResponse: ClientRegisteredResponse) => {
          if (registrationResponse.success) {
            this.projectSlug = data.project
            this.environmentSlug = data.environment
            Logger.info('Successfully registered to API')
          } else {
            let errorText: string

            try {
              const { header, body } = JSON.parse(registrationResponse.message)
              errorText = `${header}: ${body}`
            } catch {
              errorText = `Error registering to API: ${registrationResponse.message}`
            }

            Logger.error(errorText)
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
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, ...this.processEnvironmentalVariables },
      detached: true
    })

    this.childProcess.stdout.on('data', (data) => {
      process.stdout.write(`[COMMAND] ${data}`)
    })

    this.childProcess.stderr.on('data', (data) => {
      process.stderr.write(`[COMMAND] ${data}`)
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
