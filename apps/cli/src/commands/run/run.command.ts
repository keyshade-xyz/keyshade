import { Command } from 'commander'
import BaseCommand from '../base/command.interface'
import { io } from 'socket.io-client'
import {
  fetchProjectRootConfig,
  fetchUserRootConfig
} from '../../util/configuration'
import { API_BASE_URL } from '../../util/constants'
import { ProjectRootConfig, UserRootConfig } from '../configure/configure.types'
import { spawn } from 'child_process'
import { Configuration, ClientRegisteredResponse } from './run.types'
import Logger from '../../util/logger'
import {
  SecretController,
  VariableController,
  AuthController
} from '../../http'

export default class RunCommand implements BaseCommand {
  private processEnvironmentalVariables = {}

  private baseUrl: string
  private apiKey: string
  private projectId: string
  private environmentId: string

  private shouldRestart = false

  prepareCommand(program: Command): void {
    program
      .command('run')
      .description('Run a command')
      .helpCommand('-h, --help', 'Display this help message')
      .argument('<command>', 'Command to run')
      .action((command) => {
        this.action(command)
      })
  }

  private async action(command: string) {
    try {
      const configurations = await this.fetchConfigurations()

      await AuthController.checkApiKeyValidity(
        configurations.baseUrl,
        configurations.apiKey
      )

      await this.connectToSocket(configurations)

      await this.sleep(3000)

      await this.prefetchConfigurations()

      await this.executeCommand(command)
    } catch (error) {
      Logger.error(error.message)
      process.exit(1)
    }
  }

  private async fetchConfigurations(): Promise<
    ProjectRootConfig & UserRootConfig
  > {
    const {
      environment,
      project,
      workspace,
      baseUrl = API_BASE_URL
    } = await fetchProjectRootConfig()
    const { apiKey, privateKey } = await fetchUserRootConfig(project)

    return {
      environment,
      project,
      workspace,
      baseUrl,
      apiKey,
      privateKey
    }
  }

  private async connectToSocket(data: ProjectRootConfig & UserRootConfig) {
    Logger.info('Connecting to socket...')
    const host = data.baseUrl.substring(data.baseUrl.lastIndexOf('/') + 1)

    const ioClient = io(`ws://${host}/change-notifier`, {
      autoConnect: false,
      extraHeaders: {
        'x-keyshade-token': data.apiKey
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
          Logger.info(`Successfully registered to API`)

          this.projectId = registrationResponse.projectId
          this.environmentId = registrationResponse.environmentId
          this.baseUrl = data.baseUrl
          this.apiKey = data.apiKey
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
          Logger.info(`Command exited.`)
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
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }
}
