import path from 'node:path'
import { readFileSync, statSync, unlinkSync, rmSync } from 'node:fs'
import simpleGit from 'simple-git'
import { globSync } from 'glob'
import secretDetector from '@keyshade/secret-scan'
import { ScanResult } from './types'

const git = simpleGit()
const CLONING_DIR = process.env.CLONING_DIR ?? __dirname

//ignore binary files
const ignoredExtensions = [
  'png',
  'jpg',
  'jpeg',
  'gif',
  'svg',
  'ico',
  'woff',
  'woff2',
  'ttf',
  'eot',
  'pdf',
  'mp4',
  'mp3',
  'wav',
  'avi',
  'mov',
  'webm',
  'zip',
  'tar',
  'gz',
  '7z',
  'rar',
  'iso',
  'bin',
  'exe',
  'dll',
  'so',
  'a',
  'o',
  'dylib',
  'lib',
  'obj',
  'jar',
  'war',
  'ear'
]

class GitHubScanner {
  static instance: GitHubScanner | null = null
  private async sleep(ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      setTimeout(resolve, ms)
    })
  }
  private getAllFiles(localPath: string): string[] {
    const currentWorkDir = localPath
    let gitIgnorePatterns: string[] = []
    try {
      const gitIgnorePath = path.resolve(currentWorkDir, '.gitignore')

      const gitIgnoreContent = readFileSync(gitIgnorePath, 'utf8')

      gitIgnorePatterns = gitIgnoreContent
        .split('\n')
        .filter((line) => line.trim() !== '' && !line.startsWith('#'))
    } catch {
      // Repository doesn't have .gitignore file
    }

    return globSync(`${currentWorkDir}/**/**`, {
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
  private async scanSecrets(
    localPath: string,
    writer: { write: (arg: string) => void; close: () => void }
  ): Promise<ScanResult[]> {
    const foundSecrets: ScanResult[] = []
    let skipNextLine = false
    const allFiles = this.getAllFiles(localPath)
    for (const file of allFiles) {
      const stats = statSync(file)
      if (stats.isFile()) {
        if (ignoredExtensions.includes(file.split('.').pop()!)) {
          try {
            unlinkSync(file)
          } catch (err) {
            console.error(`Failed to delete file ${file}`)
          }
          continue
        }

        const content = readFileSync(file, 'utf8').split(/\r?\n/)

        try {
          unlinkSync(file)
        } catch (err) {
          console.error(`Failed to delete file ${file}`)
        }

        if (content[0].includes('keyshade-ignore-all')) {
          continue
        }

        for (let index = 0; index < content.length; index++) {
          if (skipNextLine) {
            skipNextLine = false
            continue
          }

          if (content[index].includes('keyshade-ignore')) {
            skipNextLine = true
            content
          }
          const { found, regex } = secretDetector.detect(content[index]) as {
            found: boolean
            regex: RegExp
          }
          if (found) {
            const matched = content[index].match(regex)
            const highlightedLine = content[index]
              .replace(regex, matched![0])
              .trim()
            const secret = {
              file: file.split(localPath)[1],
              line: index + 1,
              content: highlightedLine
            }
            foundSecrets.push(secret)
            writer.write(
              `${JSON.stringify({ status: 'found', secret })}<%keyshade-delim%>`
            )
            // Add delay between writes

            await this.sleep(0)
          }
        }
      }
    }

    try {
      rmSync(localPath, { recursive: true })
    } catch (err) {
      console.error(`Failed to delete directory ${localPath}`)
    }

    return foundSecrets
  }

  static async scanRepo(
    githubUrl: string,
    writer: { write: (arg: string) => void; close: () => void }
  ) {
    if (!this.instance) {
      this.instance = new GitHubScanner()
    }

    let repoName = githubUrl.split('https://github.com/')[1]
    if (repoName.endsWith('.git')) {
      repoName = repoName.slice(0, -4)
    }
    const dirName = repoName.split('/').join('_')
    const localPath = path.resolve(CLONING_DIR, dirName)

    try {
      await git.clone(githubUrl, localPath)
    } catch (error) {
      console.error('Failed to clone repository:', error)
      throw new Error('Failed to clone repository')
    }

    const foundSecrets = await this.instance.scanSecrets(localPath, writer)
    // writer.write(JSON.stringify({ status: 'completed', foundSecrets }))
    writer.close()
  }
}

export { GitHubScanner }
