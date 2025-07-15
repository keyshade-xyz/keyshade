import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import { confirm, text, multiselect } from '@clack/prompts'
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
    const startTime = performance.now()

    try {
      const parsedOptions = await this.parseOptions(options)
      if (!parsedOptions) return
      const envFileContent = await fs.readFile(
        parsedOptions.envFilePath,
        'utf-8'
      )

      const envVariables = dotenv.parse(envFileContent)
      if (Object.keys(envVariables).length === 0) {
        Logger.warn('No environment variables found in the provided file')
        return
      }

      let secretsAndVariables = secretDetector.scanJsObject(envVariables)

      Logger.info(
        'Detected secrets:\n' +
          Object.entries(secretsAndVariables.secrets)
            .map(([key, value], index) => {
              return `${index + 1}. ${key} = ${JSON.stringify(value)}`
            })
            .join('\n') +
          '\n'
      )
      Logger.info(
        'Detected variables:\n' +
          Object.entries(secretsAndVariables.variables)
            .map(([key, value], index) => {
              return `${index + 1}. ${key} = ${JSON.stringify(value)}`
            })
            .join('\n')
      )

      const toggleClassification = await confirm({
        message:
          'Do you want to toggle the classification of the detected secrets and variables? (y/N)',
        initialValue: false
      })
      if (toggleClassification) {
        const selectedSecrets = await multiselect({
          message:
            'Select all the keys that you want to classify as "Secret" (press Space to select, Enter to confirm):',
          options: Object.entries(envVariables).map(([key]) => ({
            value: key,
            label: `${key}`
          })),
          initialValues: Object.keys(secretsAndVariables.secrets)
        })

        const newSecrets: Record<string, string> = {}
        const newVariables: Record<string, string> = {}

        for (const [key, value] of Object.entries(envVariables)) {
          if (Array.isArray(selectedSecrets) && selectedSecrets.includes(key)) {
            newSecrets[key] = typeof value === 'string' ? value.trim() : value
          } else {
            newVariables[key] = typeof value === 'string' ? value.trim() : value
          }
        }

        secretsAndVariables = {
          secrets: newSecrets,
          variables: newVariables
        }

        Logger.info(
          'Updated secrets:\n' +
            Object.entries(secretsAndVariables.secrets)
              .map(([key, value], index) => {
                return `${index + 1}. ${key} = ${JSON.stringify(value)}`
              })
              .join('\n') +
            '\n'
        )
        Logger.info(
          'Updated variables:\n' +
            Object.entries(secretsAndVariables.variables)
              .map(([key, value], index) => {
                return `${index + 1}. ${key} = ${JSON.stringify(value)}`
              })
              .join('\n')
        )
      }

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

      const secretEntries = Object.entries(secretsAndVariables.secrets)
      const variableEntries = Object.entries(secretsAndVariables.variables)
      const totalSecrets = secretEntries.length
      const totalVariables = variableEntries.length

      if (totalSecrets > 0) {
        for (let i = 0; i < secretEntries.length; i++) {
          const [key, value] = secretEntries[i]
          const current = i + 1

          Logger.info(
            `🔐 Importing secrets ${current}/${totalSecrets} - ${key}`
          )

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
        Logger.success('Done importing secrets')
      }

      if (totalVariables > 0) {
        for (let i = 0; i < variableEntries.length; i++) {
          const [key, value] = variableEntries[i]
          const current = i + 1

          Logger.info(
            `🔧 Importing variables ${current}/${totalVariables} - ${key}`
          )

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
        Logger.success('Done importing variables')
      }

      const endTime = performance.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)
      const totalImported = noOfSecrets + noOfVariables

      Logger.section([
        `🔐 Secrets imported: ${noOfSecrets}`,
        `🔧 Variables imported: ${noOfVariables}`,
        `📈 Total imported: ${totalImported}`,
        `⏱️  Total time: ${duration}s`
      ])

      if (errors.length > 0) {
        Logger.warn('Some imports failed:')
        errors.forEach((error) => {
          Logger.warn(error)
        })
      }
    } catch (error) {
      const errorMessage = (error as Error)?.message
      Logger.error(
        `Failed to import secrets and variables.${errorMessage ? '\n' + errorMessage : ''}`
      )
    }
  }

  private async parseOptions(options: CommandActionData['options']): Promise<{
    envFilePath: string
  } | null> {
    const { envFile } = options
    if (!envFile) {
      Logger.error('No .env file path provided.')
      return null
    }
    const resolvedPath = path.resolve(envFile)
    const exists = await fs
      .access(resolvedPath)
      .then(() => true)
      .catch(() => false)
    if (!exists) {
      Logger.error(`The .env file does not exist at path: ${resolvedPath}`)
      return null
    }
    return { envFilePath: resolvedPath }
  }
}
