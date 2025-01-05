import simpleGit from 'simple-git'
import path from 'path'
import { readFileSync, statSync, unlinkSync, rmSync } from 'node:fs'
import { globSync } from 'glob'
import secretDetector from '@keyshade/secret-scan'

interface ScanResult {
  file: string
  line: number
  content: string
}

const git = simpleGit()
const CLONING_DIR = process.env.CLONING_DIR

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

function getAllFiles(localPath: string): string[] {
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

function scanSecrets(localPath: string): ScanResult[] {
  const foundSecrets = []
  let skipNextLine = false
  const allFiles = getAllFiles(localPath)
  for (const file of allFiles) {
    const stats = statSync(file)
    if (stats.isFile()) {
      // Skip the file if it has an ignored extension like images, videos, etc.
      if (ignoredExtensions.includes(file.split('.').pop())) {
        // Delete the file
        try {
          unlinkSync(file)
        } catch (err) {
          console.error(`Failed to delete file ${file}:`, err)
        }
        continue
      }

      const content = readFileSync(file, 'utf8').split(/\r?\n/)

      // Delete the file after reading
      try {
        unlinkSync(file)
      } catch (err) {
        console.error(`Failed to delete file ${file}:`, err)
      }

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
            file: file.split(localPath)[1],
            line: index + 1,
            content: highlightedLine
          })
        }
      })
    }
  }

  // Delete the directory after scanning
  try {
    rmSync(localPath, { recursive: true })
  } catch (err) {
    console.error(`Failed to delete directory ${localPath}:`, err)
  }

  return foundSecrets
}

export async function scanRepo(githubUrl: string) {
  let repoName = githubUrl.split('https://github.com/')[1]
  if (repoName.endsWith('.git')) {
    repoName = repoName.slice(0, -4)
  }
  const dirName = repoName.split('/').join('_')
  const localPath = path.resolve(CLONING_DIR, dirName)

  try {
    await git.clone(githubUrl, localPath)
    return scanSecrets(localPath)
  } catch (error) {
    console.error('Failed to clone repository:', error)
  }
}
