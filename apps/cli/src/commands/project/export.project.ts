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
      }
    ]
  }

  canMakeHttpRequests(): boolean {
    return true
  }

  async action({ args, options }: CommandActionData): Promise<void> {
    const [projectSlug] = args

    const { output, ...parsedOptions } = this.parseInput(options)

    Logger.info(`Exporting project ${projectSlug} configuration...`)

    const { data, error, success } =
      await ControllerInstance.getInstance().projectController.exportProjectConfigurations(
        {
          projectSlug,
          ...parsedOptions
        },
        this.headers
      )

    if (!success) {
      this.logError(error)
      return
    }

    Logger.info(`Project ${projectSlug} configuration exported successfully!`)
    this.writeConfigFiles(data, output)
  }

  private parseInput(options: CommandActionData['options']): {
    environmentSlugs: string[]
    format: string
    output: string
    privateKey?: string
  } {
    const {
      environment: environmentSlugs,
      format,
      output,
      privateKey
    } = options

    const inputSchema = z.object({
      environmentSlugs: z
        .array(z.string().min(1, { message: 'Environment cannot be empty' }))
        .nonempty({ message: 'You must specify at least one environment' }),
      format: z.string(),
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
      privateKey: z.string().optional()
    })

    const parsed = inputSchema.parse({
      environmentSlugs,
      format,
      output,
      privateKey
    })

    if (!parsed.environmentSlugs || !parsed.format || !parsed.output) {
      throw new Error('Missing required options')
    }

    return {
      environmentSlugs: parsed.environmentSlugs,
      format: parsed.format,
      output: parsed.output,
      privateKey: parsed.privateKey
    }
  }

  private writeConfigFiles(
    configurations: Record<string, string>,
    output: string
  ) {
    const entries = Object.entries(configurations)
    const multiple = entries.length > 1

    entries.forEach(([environmentSlug, rawBase64]) => {
      const fileName = multiple ? `${environmentSlug}-${output}` : output
      const filePath = join(process.cwd(), fileName)

      try {
        const content = Buffer.from(rawBase64, 'base64').toString('utf-8')
        writeFileSync(filePath, content, 'utf-8')
        Logger.info(`Wrote environment ${environmentSlug} to file ${fileName}`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        Logger.error(
          `Failed to write environment ${environmentSlug} to file ${fileName}: ${msg}`
        )
      }
    })
  }
}
