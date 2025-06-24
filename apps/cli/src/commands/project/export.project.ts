import type {
  CommandActionData,
  CommandArgument,
  CommandOption
} from '@/types/command/command.types'
import BaseCommand from '../base.command'
import ControllerInstance from '@/util/controller-instance'
import { Logger } from '@/util/logger'
import { z } from 'zod'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { buildEnvFiles, ExportFormat } from '@keyshade/common'

export default class ExportProject extends BaseCommand {
  getName(): string {
    return 'export'
  }

  getDescription(): string {
    return 'Exports configuration (secrets and variables) of a project'
  }

  getArguments(): CommandArgument[] {
    return [
      {
        name: '<Project Slug>',
        description:
          'Slug of the project that you want to export configuration from'
      }
    ]
  }

  getOptions(): CommandOption[] {
    return [
      {
        short: '-e',
        long: '--environment [entries...]',
        description: 'Slugs of the environments you want to export'
      },
      {
        short: '-f',
        long: '--format <string>',
        description: 'Format of the export (example: json)'
      },
      {
        short: '-o',
        long: '--output <string>',
        description:
          'Output file name. If multiple environments are selected, their name will be prepended to the file name'
      },
      {
        short: '-p',
        long: '--private-key <string>',
        description: 'Private key to decrypt secrets'
      },
      {
        short: '-s',
        long: '--separate-files',
        description:
          'Write variables and secrets to two separate files instead of one combined file',
        defaultValue: false
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    const { environmentSlugs, format, output, privateKey, separateFiles } =
      this.parseInput({ ...options, format: options.format.toUpperCase() })

    Logger.info(`Exporting project ${projectSlug} configuration...`)

    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.exportProjectConfigurations(
        {
          projectSlug,
          environmentSlugs
        },
        this.headers
      )

    if (!success) {
      this.logError(error)
      return
    }

    Logger.info(`Project ${projectSlug} configuration exported successfully!`)

    const fileArrays = await Promise.all(
      Object.entries(data).map(([env, { secrets = [], variables = [] }]) =>
        buildEnvFiles(
          env,
          secrets,
          variables,
          privateKey,
          format,
          separateFiles
        )
      )
    )

    const allFiles = fileArrays.flat()

    this.writeConfigFiles(allFiles, output)
  }

  private parseInput(options: CommandActionData['options']): {
    environmentSlugs: string[]
    format: string
    output: string
    privateKey: string
    separateFiles: boolean
  } {
    const {
      environment: environmentSlugs,
      format,
      output,
      privateKey,
      separateFiles
    } = options

    const inputSchema = z.object({
      environmentSlugs: z
        .array(z.string().min(1, { message: 'Environment cannot be empty' }))
        .nonempty({ message: 'You must specify at least one environment' }),
      format: z.nativeEnum(ExportFormat),
      output: z
        .string()
        .min(1, { message: 'Output filename cannot be empty' })
        // [^/\\\u0000-\u001F]+ one or more characters that are NOT:
        // - a forward slash `/`
        // - a backslash `\`
        // - any control character from U+0000 to U+001F
        // u flag              treat the pattern as Unicode (so \u0000–\u001F is recognized properly)
        /* eslint-disable-next-line no-control-regex */
        .regex(/^[^/\\\u0000-\u001F]+$/u, {
          message:
            'Invalid output filename: no slashes, backslashes, or control chars allowed'
        }),
      privateKey: z.string(),
      separateFiles: z.boolean()
    })

    const parsed = inputSchema.parse({
      environmentSlugs,
      format,
      output,
      privateKey,
      separateFiles
    })

    if (
      !parsed.environmentSlugs ||
      !parsed.format ||
      !parsed.output ||
      !parsed.privateKey
    ) {
      throw new Error('Missing required options')
    }

    return {
      environmentSlugs: parsed.environmentSlugs,
      format: parsed.format,
      output: parsed.output,
      privateKey: parsed.privateKey,
      separateFiles: parsed.separateFiles
    }
  }

  private writeConfigFiles(
    configurations: { filename: string; content: string }[],
    output: string
  ) {
    const multiple = configurations.length > 1

    configurations.forEach(({ filename: basicFileName, content }) => {
      const fileName = multiple ? `${basicFileName}.${output}` : output
      const filePath = join(process.cwd(), fileName)

      try {
        writeFileSync(filePath, content, 'utf-8')
        Logger.info(`Wrote configuration ${basicFileName} to file ${fileName}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        Logger.error(
          `Failed to write environment ${basicFileName} to file ${fileName}: ${msg}`
        )
      }
    })
  }
}
