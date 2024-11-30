import { NextResponse } from 'next/server'
import secretDetector from '@keyshade/secret-scan'
import { VulnerableFile } from './types'

const GITHUB_CONTENTS_URL =
  'https://api.github.com/repos/{repo_name}/contents/{path}'

function get_content_url(repo_name: string, path: string) {
  return GITHUB_CONTENTS_URL.replace('{repo_name}', repo_name).replace(
    '{path}',
    path
  )
}

// stack implementation
async function find_secrets_eff(
  content_url: string,
  vulnerableFiles: VulnerableFile[]
) {
  const stack: string[] = [content_url]
  while (stack.length > 0) {
    const current = stack.pop()
    const response = await fetch(current!, {
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
        const file_response = await fetch(file.download_url)
        const file_data = await file_response.text()
        const content = file_data.split(/\r?\n/)

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
      } else if (file.type === 'dir') stack.push(file.url)
    }
  }
}

// recursive implementation
async function find_secrets(
  content_url: string,
  vulnerableFiles: VulnerableFile[]
) {
  const response = await fetch(content_url, {
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
      const file_response = await fetch(file.download_url)
      const file_data = await file_response.text()
      const content = file_data.split(/\r?\n/)

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
    } else if (file.type === 'dir')
      await find_secrets(file.url, vulnerableFiles)
  }
}

async function secret_scan(repo_url: string) {
  const repo_name = repo_url.split('https://github.com/')[1]
  console.log('Repo Name: ', repo_name)
  try {
    const isValid_url = await fetch(get_content_url(repo_name, ''), {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
      }
    })
  } catch {
    return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 })
  }

  const vulnerableFiles: VulnerableFile[] = []
  try {
    const start = Date.now()
    await find_secrets_eff(get_content_url(repo_name, ''), vulnerableFiles)
    const end = Date.now()
    console.log('Time taken: ', end - start)
  } catch (error) {
    return 'Rate limit hit'
  }
  return vulnerableFiles
}

export { secret_scan }
