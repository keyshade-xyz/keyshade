import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import { confirm, text } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'
import secretDetector from '@keyshade/secret-scan'

export default class ImportFromEnv extends BaseCommand {
  getName(): string {
    return 'import'
  }

  getDescription(): string {
    return 'Imports environment secrets and variables from .env file to a project.'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description: 'Slug of the project where envs will be imported.'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-f',
        long: '--env-file <string>',
        description: 'Path to the .env file'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    try {
      const { envFilePath } = await this.parseOptions(options)
      if (!envFilePath) return
      const envFileContent = await fs.readFile(envFilePath, 'utf-8')
      // Logger.info('File contents:\n' + envFileContent)

      const envVariables = dotenv.parse(envFileContent)
      if (Object.keys(envVariables).length === 0) {
        Logger.warn('No environment variables found in the provided file')
        return
      }

      const secretsAndVariables = secretDetector.detectJsObject(envVariables)

      Logger.info(
        'Detected secrets:\n' +
          Object.entries(secretsAndVariables.secrets)
            .map(([key, value]) => key + ' = ' + JSON.stringify(value))
            .join('\n')
      )
      Logger.info(
        'Detected variables:\n' +
          Object.entries(secretsAndVariables.variables)
            .map(([key, value]) => key + ' = ' + JSON.stringify(value))
            .join('\n')
      )

      const confirmImport = await confirm({
        message:
          'Do you want to proceed with importing the environment variables? (y/N)',
        initialValue: false
      })

      if (!confirmImport) {
        Logger.info('Import cancelled by the user.')
        return
      }

      const environmentSlug = (await text({
        message: 'Enter the environment slug to import to:'
      })) as string

      Logger.info(
        `Importing secrets and variables to project: ${projectSlug} and environment: ${environmentSlug} with default settings`
      )

      let noOfSecrets = 0
      let noOfVariables = 0
      const errors: string[] = []
      for (const [key, value] of Object.entries(secretsAndVariables.secrets)) {
        const { error, success } =
          await ControllerInstance.getInstance().secretController.createSecret(
            {
              projectSlug,
              name: key,
              entries: [
                {
                  value,
                  environmentSlug
                }
              ]
            },
            this.headers
          )

        if (success) {
          ++noOfSecrets
        } else {
          errors.push(
            `Failed to create secret for ${key}. Error: ${error.message}.`
          )
        }
      }

      for (const [key, value] of Object.entries(
        secretsAndVariables.variables
      )) {
        const { error, success } =
          await ControllerInstance.getInstance().variableController.createVariable(
            {
              projectSlug,
              name: key,
              entries: [
                {
                  value,
                  environmentSlug
                }
              ]
            },
            this.headers
          )

        if (success) {
          ++noOfVariables
        } else {
          errors.push(
            `Failed to create variable for ${key}. Error: ${error.message}.`
          )
        }
      }
      Logger.info(
        `Imported ${noOfSecrets} secrets and ${noOfVariables} variables.`
      )
      if (errors.length) Logger.error(errors.join('\n'))
    } catch (error) {
      const errorMessage = (error as Error)?.message
      Logger.error(
        `Failed to import secrets and variables.${errorMessage ? '\n' + errorMessage : ''}`
      )
    }
  }

  private async parseOptions(options: CommandActionData['options']): Promise<{
    envFilePath: string | undefined
  }> {
    const { envFile } = options
    if (!envFile) {
      Logger.error('No .env file path provided.')
      return { envFilePath: undefined }
    }
    const resolvedPath = path.resolve(envFile)
    const exists = await fs
      .access(resolvedPath)
      .then(() => true)
      .catch(() => false)
    if (!exists) {
      Logger.error(`The .env file does not exist at path: ${resolvedPath}`)
      return { envFilePath: undefined }
    }

    return { envFilePath: resolvedPath }
  }
}
