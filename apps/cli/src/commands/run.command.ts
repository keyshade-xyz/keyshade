/* eslint-disable @typescript-eslint/indent */
import BaseCommand from './base.command'
import { io } from 'socket.io-client'
import { spawn } from 'child_process'
import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import { fetchPrivateKey } from '@/util/configuration'
import { ConfigurationManager } from '@/util/enhanced-configuration'
import type {
  ClientRegisteredResponse,
  Configuration,
  RunData
} from '@/types/command/run.types'

import { decrypt } from '@/util/decrypt'

import { SecretController, VariableController } from '@keyshade/api-client'
import { log, spinner } from '@clack/prompts'
import { clearSpinnerLines, showError, showSuccess } from '@/util/prompt'

export default class RunCommand extends BaseCommand {
  private processEnvironmentalVariables = {}

  private projectSlug: string
  private environmentSlug: string
  private command: string

  private childProcess = null

  getName(): string {
    return 'run'
  }

  getDescription(): string {
    return 'Run a command with live configuration updates from keyshade'
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
      },
      {
        short: '-w',
        long: '--workspace <slug>',
        description: 'Workspace to configure'
      },
      {
        short: '-p',
        long: '--project <slug>',
        description: 'Project to configure'
      },
      {
        short: '-f',
        long: '--config-file <path>',
        description:
          'Path to config file (supports multiple, default: auto-discover keyshade.json)'
      },
      {
        short: '-P',
        long: '--profile <name>',
        description: 'Profile to use from configuration file'
      },
      {
        short: '-n',
        long: '--no-interactive',
        description: 'Run in non-interactive mode (error on missing config)'
      },
      {
        short: '-d',
        long: '--dry-run',
        description: 'Show resolved configuration without executing the command'
      },
      {
        short: '-D',
        long: '--debug-config',
        description: 'Show detailed configuration debug information'
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

    // Pass all relevant options to fetchConfigurations for proper precedence handling
    const configurations = await this.fetchConfigurations({
      workspace: options.workspace,
      project: options.project,
      environment: options.environment,
      configFile: options.configFile,
      profile: options.profile,
      noInteractive: options.noInteractive,
      dryRun: options.dryRun,
      debugConfig: options.debugConfig
    })

    await this.connectToSocket(configurations)
    await this.sleep(3000)
    await this.prefetchConfigurations(configurations.privateKey)
    this.spawnCommand()

    process.on('SIGINT', () => {
      void this.killCommand()
      process.exit(0)
    })
  }

  private async fetchConfigurations(
    options: {
      workspace?: string
      project?: string
      environment?: string
      configFile?: string
      profile?: string
      noInteractive?: boolean
      dryRun?: boolean
      debugConfig?: boolean
    } = {}
  ): Promise<RunData> {
    // Use the enhanced configuration manager
    const configFiles = options.configFile
      ? Array.isArray(options.configFile)
        ? options.configFile
        : [options.configFile]
      : undefined

    const manager = new ConfigurationManager({
      workspace: options.workspace,
      project: options.project,
      environment: options.environment,
      configFiles,
      profile: options.profile,
      noInteractive: options.noInteractive,
      dryRun: options.dryRun,
      debugConfig: options.debugConfig
    })

    const resolvedConfig = await manager.resolveConfiguration()

    // Handle dry-run mode
    if (options.dryRun) {
      console.log('\n=== Dry Run Mode - Resolved Configuration ===')
      console.log(`Workspace: ${resolvedConfig.workspace}`)
      console.log(`Project: ${resolvedConfig.project}`)
      console.log(`Environment: ${resolvedConfig.environment}`)
      console.log(
        `Quit on Decryption Failure: ${resolvedConfig.quitOnDecryptionFailure}`
      )

      if (resolvedConfig.sources.length > 0) {
        console.log('\nConfiguration Sources:')
        resolvedConfig.sources.forEach((source, index) => {
          console.log(`  ${index + 1}. ${source.source}: ${source.path}`)
        })
      }
      console.log('============================================\n')
      process.exit(0)
    }

    // Fetch private key for the project
    const privateKey = await fetchPrivateKey(resolvedConfig.project)

    if (!privateKey) {
      throw new Error(
        `Private key not found for project '${resolvedConfig.project}'. Please run 'keyshade init' or 'keyshade config private-key add' to add a private key.`
      )
    }

    return {
      workspace: resolvedConfig.workspace,
      project: resolvedConfig.project,
      environment: resolvedConfig.environment,
      quitOnDecryptionFailure: resolvedConfig.quitOnDecryptionFailure,
      privateKey
    }
  }

  private getWebsocketType(baseUrl: string) {
    if (baseUrl.startsWith('https')) {
      return 'wss'
    }
    return 'ws'
  }

  private async connectToSocket(data: RunData) {
    const loading = spinner()
    loading.start('Connecting to keyshade servers...')
    await this.sleep(2000)

    // Fix: Parse the full host from baseUrl, not just the last segment
    const url = new URL(this.baseUrl)
    const websocketUrl = `${this.getWebsocketType(this.baseUrl)}://${url.host}/change-notifier`
    const privateKey = data.privateKey
    const quitOnDecryptionFailure = data.quitOnDecryptionFailure

    const ioClient = io(websocketUrl, {
      autoConnect: false,
      extraHeaders: {
        'x-keyshade-token': this.token
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
        log.info(`${data.name} got updated. Restarting the process...`)

        if (!data.isPlaintext) {
          try {
            data.value = await decrypt(privateKey, data.value)
          } catch (error) {
            if (quitOnDecryptionFailure) {
              await showError(
                `Failed decrypting ${data.name}'s value. Stopping the process.`
              )
              process.exit(1)
            } else {
              await showError(
                `Failed decrypting ${data.name}'s value. No changes will be made to the process.`
              )
              return
            }
          }
        }

        this.processEnvironmentalVariables[data.name] = data.value
        await this.restartCommand()
      })
      // Set a timeout for registration response
      const registrationTimeout = setTimeout(() => {
        showError(
          'We tried connecting to keyshade servers for 30 seconds but failed. Please try again later.'
        )
          .catch(() => {})
          .finally(() => process.exit(1))
      }, 30000)

      ioClient.on(
        'client-registered',
        async (registrationResponse: ClientRegisteredResponse) => {
          clearTimeout(registrationTimeout)

          if (registrationResponse.success) {
            this.projectSlug = data.project
            this.environmentSlug = data.environment

            loading.stop()
            clearSpinnerLines()
            await showSuccess('Successfully connected to keyshade servers!')
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

            loading.stop()
            clearSpinnerLines()
            await showError(
              `We encountered an error while connecting you to our servers: ${errorMessage}`
            )
            process.exit(1)
          }
        }
      )
    })
  }

  private async prefetchConfigurations(privateKey: string) {
    log.info('Fetching existing secrets and variables from your project...')
    const secretController = new SecretController(this.baseUrl)
    const variableController = new VariableController(this.baseUrl)

    const secretsResponse = await secretController.getAllSecretsOfEnvironment(
      {
        environmentSlug: this.environmentSlug,
        projectSlug: this.projectSlug
      },
      {
        'x-keyshade-token': this.token
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
          'x-keyshade-token': this.token
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
    log.info(
      `Fetched ${secretsResponse.data.length} secrets and ${variablesResponse.data.length} variables`
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

  private async waitForExit(
    child: ReturnType<typeof spawn>,
    timeoutMs = 15000
  ): Promise<void> {
    if (!child) return

    await new Promise<void>((resolve, reject) => {
      let settled = false

      const onExit = () => {
        if (!settled) {
          settled = true
          resolve()
        }
      }

      child.once('exit', onExit)
      child.once('close', onExit)

      const t = setTimeout(() => {
        if (!settled) {
          settled = true
          reject(new Error('Child did not exit before timeout'))
        }
      }, timeoutMs)

      // Cleanup if promise resolves early
      const cleanup = () => {
        clearTimeout(t)
      }
      child.once('exit', cleanup)
      child.once('close', cleanup)
    })
  }

  private spawnCommand() {
    // POSIX: create a new process group so -PID signals the entire tree
    const isWin = process.platform === 'win32'

    this.childProcess = spawn(this.command, [], {
      shell: true,
      stdio: 'inherit',
      env: {
        ...process.env,
        ...Object.fromEntries(
          Object.entries(this.processEnvironmentalVariables).map(
            ([key, value]) => [key, String(value)]
          )
        )
      },
      detached: !isWin // only on POSIX
    })

    // Allow parent to exit independently of child on POSIX process groups
    if (!isWin && this.childProcess?.pid) {
      this.childProcess.unref()
    }

    this.childProcess.on(
      'exit',
      (code: number | null, signal: NodeJS.Signals | null) => {
        // Do NOT exit the CLI on child exit; we want to keep listening & restart on updates.
        if (code === 0) {
          log.info(
            `Command exited successfully${signal ? ` (signal ${signal})` : ''}.`
          )
        } else {
          log.info(
            `Command exited${code !== null ? ` with code ${code}` : ''}${signal ? ` (signal ${signal})` : ''}.`
          )
        }
      }
    )
  }

  private async restartCommand() {
    try {
      await this.killCommand() // now truly awaits exit
      this.spawnCommand()
    } catch (e) {
      console.error('Failed to restart command:', e)
      // As a last resort, try to spawn anyway
      this.spawnCommand()
    }
  }

  private async killCommand() {
    const child = this.childProcess
    if (!child?.pid) return

    const isWin = process.platform === 'win32'
    const pid = child.pid

    try {
      // 1) Try graceful termination
      if (isWin) {
        // /T kills the whole tree; /F is force; first attempt without /F
        await new Promise<void>((resolve) => {
          const killer = spawn('taskkill', ['/PID', String(pid), '/T'], {
            stdio: 'ignore'
          })
          killer.on('exit', () => {
            resolve()
          })
          killer.on('error', () => {
            resolve()
          }) // ignore errors, we’ll force kill below if needed
        })
      } else {
        // Negative PID targets the process group (requires detached: true at spawn)
        try {
          process.kill(-pid, 'SIGTERM')
        } catch {
          // Fallback to direct child if not in its own group
          try {
            process.kill(pid, 'SIGTERM')
          } catch {}
        }
      }

      // 2) Wait up to 5s for clean exit
      try {
        await this.waitForExit(child, 5000)
      } catch {
        // 3) Force kill if it didn’t exit
        if (isWin) {
          await new Promise<void>((resolve) => {
            const killer = spawn(
              'taskkill',
              ['/PID', String(pid), '/T', '/F'],
              { stdio: 'ignore' }
            )
            killer.on('exit', () => {
              resolve()
            })
            killer.on('error', () => {
              resolve()
            })
          })
        } else {
          try {
            process.kill(-pid, 'SIGKILL')
          } catch {
            try {
              process.kill(pid, 'SIGKILL')
            } catch {}
          }
          // Give the OS a moment to reap and free the port
          await this.sleep(200)
        }
      }
    } finally {
      this.childProcess = null
    }
  }
}
