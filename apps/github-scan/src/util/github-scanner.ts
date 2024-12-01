import secretDetector from '@keyshade/secret-scan'
import { VulnerableFile } from './types'

class GitHubScanner {
  private GITHUB_CONTENTS_URL =
    'https://api.github.com/repos/{repo_name}/contents/{path}'

  private getContentUrl(repoName: string, path: string) {
    return this.GITHUB_CONTENTS_URL.replace('{repo_name}', repoName).replace(
      '{path}',
      path
    )
  }

  private async findSecrets(
    contentUrl: string,
    vulnerableFiles: VulnerableFile[]
  ) {
    const stack: string[] = [contentUrl]
    while (stack.length > 0) {
      const currentContent = stack.pop()
      const response = await fetch(currentContent!, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        }
      })
      const data = await response.json()
      for (const file of data) {
        console.log(file.path)
        if (file.type === 'file') {
          if (file.name.match(/\.(jpg|jpeg|png|gif|mp4|mkv|avi)$/)) {
            continue
          }
          const fileResponse = await fetch(file.download_url)
          const fileData = await fileResponse.text()
          const content = fileData.split(/\r?\n/)

          let skipNextLine = false
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
              const highlightedLine = line.replace(regex, matched![0]).trim()
              vulnerableFiles.push({
                name: file.path,
                line: index + 1,
                content: highlightedLine
              })
            }
          })
        } else if (file.type === 'dir') {
          stack.push(file.url)
        }
      }
    }
  }

  public async scanRepo(githubUrl: string) {
    const repoName = githubUrl.split('https://github.com/')[1]
    console.log('Repo Name: ', repoName)
    try {
      // Check if the URL is valid
      await fetch(this.getContentUrl(repoName, ''), {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
        }
      })
    } catch {
      throw new Error('Invalid GitHub URL')
    }

    const vulnerableFiles: VulnerableFile[] = []
    try {
      const start = Date.now()
      await this.findSecrets(this.getContentUrl(repoName, ''), vulnerableFiles)
      const end = Date.now()
      console.log('Time taken: ', end - start)
    } catch (error) {
      throw new Error('Rate limit hit')
    }
    return vulnerableFiles
  }
}

const gitHubScanner = new GitHubScanner()

export default gitHubScanner
