import BaseCommand from '@/commands/base.command'
import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import { execSync } from 'child_process'
import { readFileSync, statSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'
import secretDetector from '@keyshade/secret-scan'
import { Logger } from '@/util/logger'

export default class ScanCommand extends BaseCommand {
  getOptions(): CommandOption[] {
    return [
      {
        short: '-f',
        long: '--file <string>',
        description: 'Scan a specific file'
      },
      {
        short: '-c',
        long: '--current-changes',
        description:
          'Scan only the current changed files that are not committed'
      }
    ]
  }

  getName(): string {
    return 'scan'
  }

  getDescription(): string {
    return 'Scan the project to detect any hardcoded secrets'
  }

  action({ options }: CommandActionData): Promise<void> | void {
    Logger.info('🔍 Secret Scan Started')
    const { currentChanges, file } = options

    Logger.info('\n=============================')
    Logger.info('🔍 Secret Scan Started')
    Logger.info('=============================')

    if (file) {
      Logger.info(`Scanning file: ${file}`)
      this.scanFiles([file as string])
      return
    }
    if (currentChanges) {
      Logger.info('Scanning only the current changes')
      const files = this.getChangedFiles()
      this.scanFiles(files)
    } else {
      Logger.info('\n\n📂 Scanning all files...\n')
      const files = this.getAllFiles()
      this.scanFiles(files)
    }
  }

  private scanFiles(allFiles: string[]) {
    const foundSecrets = []
    let skipNextLine = false
    for (const file of allFiles) {
      const stats = statSync(file)
      if (stats.isFile()) {
        const content = readFileSync(file, 'utf8').split(/\r?\n/)

        // Skip the file if ignore comment is found in the first line
        if (content[0].includes('keyshade-ignore-all')) {
          continue
        }

        content.forEach((line, index) => {
          // Skip the next line if ignore comment is found in the previous line
          if (skipNextLine) {
            skipNextLine = false
            return
          }

          if (line.includes('keyshade-ignore')) {
            skipNextLine = true
            return
          }
          const { found, regex } = secretDetector.detect(line) as {
            found: boolean
            regex: RegExp
          }
          if (found) {
            const matched = line.match(regex)
            const highlightedLine = line.replace(regex, matched[0]).trim()
            foundSecrets.push({
              file,
              line: index + 1,
              content: highlightedLine
            })
          }
        })
      }
    }
    if (foundSecrets.length > 0) {
      Logger.info(`\n 🚨 Found ${foundSecrets.length} hardcoded secrets:\n`)
      foundSecrets.forEach((secret) => {
        Logger.info(`${`${secret.file}:${secret.line}`}: ${secret.content}`)
        Logger.info(
          'Suggestion: Replace with environment variables or secure storage solutions.\n'
        )
      })
      Logger.info('=============================')
      Logger.info('Summary:')
      Logger.info('=============================')
      Logger.info(`🚨 Total Secrets Found: ${foundSecrets.length}\n`)

      process.exit(1)
    } else {
      Logger.info('=============================')
      Logger.info('Summary:')
      Logger.info('=============================')
      Logger.info('✅ Total Secrets Found: 0\n')
      Logger.info('No hardcoded secrets found.')
    }
  }

  private getAllFiles(): string[] {
    const currentWorkDir = process.cwd()
    let gitIgnorePatterns: string[] = []
    try {
      const gitIgnorePath = path.resolve(currentWorkDir, '.gitignore')

      const gitIgnoreContent = readFileSync(gitIgnorePath, 'utf8')

      gitIgnorePatterns = gitIgnoreContent
        .split('\n')
        .filter((line) => line.trim() !== '' && !line.startsWith('#'))
    } catch (error) {
      Logger.info("Repository doesn't have .gitignore file")
    }

    return globSync(currentWorkDir + '/**/**', {
      dot: true,
      ignore: {
        ignored: (p) => {
          return gitIgnorePatterns.some((pattern) => {
            return p.isNamed(pattern)
          })
        },
        childrenIgnored: (p) => {
          return gitIgnorePatterns.some((pattern) => {
            return p.isNamed(pattern)
          })
        }
      }
    })
  }

  private getChangedFiles(): string[] {
    const output = execSync('git status -s').toString()
    const files = output
      .split('\n')
      .filter((line) => {
        if (typeof line === 'undefined') {
          return false
        }
        return line
      })
      .map((line) => {
        line = line.trim().split(' ')[1]
        return path.resolve(process.cwd(), line)
      })
    return files
  }
}
