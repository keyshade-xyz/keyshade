/* eslint-disable @typescript-eslint/indent */
import BaseCommand from './base.command'
import { io } from 'socket.io-client'
import { spawn } from 'child_process'
import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import { AuthController, SecretController, VariableController } from '@/http'
import type { ProjectRootConfig } from '@/types/index.types'
import {
  fetchPrivateKeyConfig,
  fetchProjectRootConfig
} from '@/util/configuration'
import { Logger } from '@/util/logger'
import type {
  ClientRegisteredResponse,
  Configuration
} from '@/types/command/run.types'

export default class RunCommand extends BaseCommand {
  private processEnvironmentalVariables = {}

  private projectId: string
  private environmentId: string

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
    await AuthController.checkApiKeyValidity(this.baseUrl, this.apiKey)
    await this.connectToSocket(configurations)
    await this.sleep(3000)
    await this.prefetchConfigurations()
    await this.executeCommand(args[0])
  }

  private async fetchConfigurations(): Promise<
    ProjectRootConfig & { privateKey: string }
  > {
    const { environment, project, workspace } = await fetchProjectRootConfig()
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
      privateKey
    }
  }

  private getWebsocketType(baseUrl: string) {
    if (baseUrl.startsWith('https')) {
      return 'wss'
    }
    return 'ws'
  }

  private async connectToSocket(data: ProjectRootConfig) {
    Logger.info('Connecting to socket...')
    const host = this.baseUrl.substring(this.baseUrl.lastIndexOf('/') + 1)
    const websocketUrl = `${this.getWebsocketType(this.baseUrl)}://${host}/change-notifier`

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
        workspaceName: data.workspace,
        projectName: data.project,
        environmentName: data.environment
      })

      ioClient.on('configuration-updated', async (data: Configuration) => {
        Logger.info(
          `Configuration change received from API (name: ${data.name}, value: ${data.value})`
        )
        this.processEnvironmentalVariables[data.name] = data.value
        this.shouldRestart = true
      })

      ioClient.on(
        'client-registered',
        (registrationResponse: ClientRegisteredResponse) => {
          Logger.info('Successfully registered to API')

          this.projectId = registrationResponse.projectId
          this.environmentId = registrationResponse.environmentId
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
    // Fetch all secrets
    const secrets = await SecretController.fetchSecrets(
      this.baseUrl,
      this.apiKey,
      this.projectId,
      this.environmentId
    )

    // Fetch all variables
    const variables = await VariableController.fetchVariables(
      this.baseUrl,
      this.apiKey,
      this.projectId,
      this.environmentId
    )

    // Merge secrets and variables
    const configurations = [...secrets, ...variables]
    Logger.info(
      `Fetched ${configurations.length} configurations (${secrets.length} secrets, ${variables.length} variables)`
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
}
