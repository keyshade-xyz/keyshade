import BaseCommand from '@/commands/base.command'
import type {
  CommandActionData,
  CommandOption
} from '@/types/command/command.types'
import { execSync } from 'child_process'
import { readFileSync, statSync } from 'fs'
import { globSync } from 'glob'
import path from 'path'
import secretDetector from 'secret-scan'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const colors = require('colors/safe')

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
    const { currentChanges, file } = options

    console.log('\n=============================')
    console.log(colors.cyan.bold('🔍 Secret Scan Started'))
    console.log('=============================')

    if (file) {
      console.log(`Scanning file: ${file}`)
      this.scanFiles([file as string])
      return
    }
    if (currentChanges) {
      console.log('Scanning only the current changes')
      const files = this.getChangedFiles()
      this.scanFiles(files)
    } else {
      console.log('\n\n📂 Scanning all files...\n')
      const files = this.getAllFiles()
      this.scanFiles(files)
    }
  }

  private scanFiles(allfiles: string[]) {
    const foundSecrets = []
    let skipNextLine = false
    for (const file of allfiles) {
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
          const { found, regex } = secretDetector.detect(line)
          if (found) {
            const matched = line.match(regex)
            const highlightedLine = line
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              .replace(regex, colors.red.underline(matched[0]) as string)
              .trim()
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
      console.log(
        colors.red(`\n 🚨 Found ${foundSecrets.length} hardcoded secrets:\n`)
      )
      foundSecrets.forEach((secret) => {
        console.log(
          `${colors.underline(`${secret.file}:${secret.line}`)}: ${secret.content}`
        )
        console.log(
          colors.yellow(
            'Suggestion: Replace with environment variables or secure storage solutions.\n'
          )
        )
      })
      console.log('=============================')
      console.log('Summary:')
      console.log('=============================')
      console.log(`🚨 Total Secrets Found: ${foundSecrets.length}\n`)

      process.exit(1)
    } else {
      console.log('=============================')
      console.log('Summary:')
      console.log('=============================')
      console.log('✅ Total Secrets Found: 0\n')
      console.log(colors.green('No hardcoded secrets found.'))
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
      console.log("Repository doesn't have .gitignore file")
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
