import express, { type Express } from 'express'
import { scanRepo } from './util'

export const createServer = (): Express => {
  const app = express()
  app.use(express.json())

  app.get('/', (_, res) => {
    res.send(`GitHub Scan API from Keyshade.xyz`)
  })
  app.post('/scan', async (req, res) => {
    const { username, password, githubUrl } = req.body
    if (
      username !== process.env.GITHUB_SCAN_API_USERNAME ||
      password !== process.env.GITHUB_SCAN_API_PASSWORD
    ) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    if (!githubUrl || !githubUrl.startsWith('https://github.com/')) {
      return res
        .status(400)
        .json({ message: 'Invalid or missing githubUrl parameter' })
    }
    try {
      res.status(200).json({ files: await scanRepo(githubUrl) })
    } catch (error) {
      console.error(`Error scanning repo, githubUrl:${githubUrl} `, error)
      res.status(500).json({ message: 'Internal Server Error' })
    }
  })

  return app
}
