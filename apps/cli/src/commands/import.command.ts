import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from './base.command'
import { confirm, log, multiselect, spinner, text } from '@clack/prompts'
import ControllerInstance from '@/util/controller-instance'
import fs from 'node:fs/promises'
import path from 'node:path'
import dotenv from 'dotenv'
import secretDetector from '@keyshade/secret-scan'
import { clearSpinnerLines, handleSIGINT } from '@/util/prompt'
import { WorkspaceUtils } from '@/util/workspace'
import { ProjectUtils } from '@/util/project'
import { EnvironmentUtils } from '@/util/environment'

export default class ImportCommand extends BaseCommand {
  getName(): string {
    return 'import'
  }

  getDescription(): string {
    return 'Imports environment variables from .env file into a project in keyshade.'
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-f',
        long: '--env-file <string>',
        description: 'Path to the .env file'
      },
      {
        short: '-p',
        long: '--project <string>',
        description:
          'Slug of the project where environment variables will be imported'
      },
      {
        short: '-e',
        long: '--environment <string>',
        description:
          'Slug of the environment where environment variables will be imported'
      }
    ]
  }

  getUsage(): string {
    return `keyshade import [options]
    
    Import environment variables from .env file into a project in keyshade.
    keyshade import --env-file ./my-project/.env --project my-project-0 --environment dev-0
    `
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ options }: CommandActionData): Promise<void> {
    try {
      const { envFilePath, projectSlug, environmentSlug } =
        await this.parseOptions(options)
      const envFileContent = await fs.readFile(envFilePath, 'utf-8')

      const envVariables = dotenv.parse(envFileContent)
      if (Object.keys(envVariables).length === 0) {
        log.warn('No environment variables found in the provided file')
        return
      }

      let secretsAndVariables = secretDetector.scanJsObject(envVariables)

      log.info(
        'Detected secrets:\n' +
          Object.entries(secretsAndVariables.secrets)
            .map(([key, value], index) => {
              return `${index + 1}. ${key} = ${JSON.stringify(value)}`
            })
            .join('\n') +
          '\n'
      )
      log.info(
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
      handleSIGINT(toggleClassification, 'Import cancelled!')

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
        handleSIGINT(selectedSecrets, 'Import cancelled!')

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

        log.info(
          'Updated secrets:\n' +
            Object.entries(secretsAndVariables.secrets)
              .map(([key, value], index) => {
                return `${index + 1}. ${key} = ${JSON.stringify(value)}`
              })
              .join('\n') +
            '\n'
        )
        log.info(
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
      handleSIGINT(confirmImport, 'Import cancelled!')

      if (!confirmImport) {
        log.info('Import cancelled!')
        return
      }

      const secretEntries = Object.entries(secretsAndVariables.secrets).map(
        ([key, value]) => ({
          name: key,
          value,
          environmentSlug
        })
      )
      const variableEntries = Object.entries(secretsAndVariables.variables).map(
        ([key, value]) => ({
          name: key,
          value,
          environmentSlug
        })
      )
      const totalSecrets = secretEntries.length
      const totalVariables = variableEntries.length

      if (totalSecrets > 0) {
        const loading = spinner()
        loading.start('🔐 Importing secrets')

        const { error, success } =
          await ControllerInstance.getInstance().secretController.bulkCreateSecrets(
            {
              projectSlug,
              secrets: secretEntries
            },
            this.headers
          )

        loading.stop()
        clearSpinnerLines()

        if (success) {
          log.success('✅ Done importing secrets')
        } else {
          const message = JSON.parse(error.message).body
          log.error(`❌ ${message}`)
        }
      }

      if (totalVariables > 0) {
        const loading = spinner()
        loading.start('🔧 Importing variables')

        const { success, error } =
          await ControllerInstance.getInstance().variableController.bulkCreateVariables(
            {
              projectSlug,
              variables: variableEntries
            },
            this.headers
          )

        loading.stop()
        clearSpinnerLines()

        if (success) {
          log.success('✅ Done importing variables')
        } else {
          const message = JSON.parse(error.message).body
          log.error(`❌ ${message}`)
        }
      }
    } catch (error) {
      throw new Error(
        '❌ We encountered an error while importing your secrets and variables!'
      )
    }
  }

  private async parseOptions(options: CommandActionData['options']): Promise<{
    envFilePath: string
    projectSlug: string
    environmentSlug: string
  } | null> {
    let { envFile, project, environment } = options

    if (Object.keys(options).length === 0) {
      const envFileText = await text({
        message: 'Enter the path to the .env file:',
        placeholder: './.env'
      })
      handleSIGINT(envFileText, 'Import cancelled')
      envFile = envFileText as string

      const workspace = await WorkspaceUtils.selectWorkspaceFromMenu(
        this.headers
      )

      project = await ProjectUtils.selectProjectFromMenu(
        workspace,
        this.headers
      )

      environment = await EnvironmentUtils.selectEnvironmentFromMenu(
        project,
        this.headers
      )
    } else {
      if (!envFile) {
        throw new Error('No .env file path provided.')
      }

      if (!project) {
        throw new Error('No project provided.')
      }
    }

    const resolvedPath = path.resolve(envFile)
    const exists = await fs
      .access(resolvedPath)
      .then(() => true)
      .catch(() => false)
    if (!exists) {
      throw new Error(`The .env file does not exist at path: ${resolvedPath}`)
    }

    return {
      envFilePath: resolvedPath,
      projectSlug: project,
      environmentSlug: environment
    }
  }
}
