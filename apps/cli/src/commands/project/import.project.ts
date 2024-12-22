import type {
  CommandActionData,
  CommandArgument
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import { confirm, text } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'
import secretDetector from '@keyshade/secret-scan'

export default class ImportEnvs extends BaseCommand {
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
      },
      {
        name: '<.env file path>',
        description: 'Path to the .env file'
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args }: CommandActionData): Promise<void> {
    const [projectSlug, dotEnvPath] = args

    try {
      const envFileContent = await fs.readFile(
        path.resolve(dotEnvPath),
        'utf-8'
      )

      const envVariables = dotenv.parse(envFileContent)

      const secretsAndVariables = secretDetector.detectObject(envVariables)

      Logger.info(
        'Detected secrets:\n' +
          secretsAndVariables.secrets
            .map((secret) => secret[0] + ' = ' + secret[1])
            .join('\n')
      )
      Logger.info(
        'Detected variables:\n' +
          secretsAndVariables.variables
            .map((variable) => variable[0] + ' = ' + variable[1])
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
      for (const [key, value] of secretsAndVariables.secrets) {
        const { data, error, success } =
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

      for (const [key, value] of secretsAndVariables.variables) {
        const { data, error, success } =
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
}
