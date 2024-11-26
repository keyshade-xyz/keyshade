import { exec } from 'child_process'

export default async function teardown() {
  await executeCommand('docker compose down')
  await executeCommand('docker compose -f ../../docker-compose-test.yml up -d')
  await executeCommand('cd ../.. && pnpm build:api')
  await executeCommand('cd ../.. && sleep 5 && pnpm db:deploy-migrations', {
    DATABASE_URL: 'postgresql://prisma:prisma@localhost:5432/tests',
    PATH: process.env.PATH!
  })
  await startAPI()
}

function executeCommand(
  command: string,
  env?: Record<string, string>
): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, { env }, (error, stdout, stderr) => {
      console.log('Executing: ', command)
      if (error) {
        stderr && console.error('Error:', stderr)
        reject(error)
      } else {
        stdout && console.log('Output:', stdout)
        resolve()
      }
    })
  })
}

function startAPI(): Promise<void> {
  return new Promise((resolve) => {
    const apiProcess = exec('cd ../../ && pnpm run start:api', {
      env: {
        PATH: process.env.PATH,
        DATABASE_URL: 'postgresql://prisma:prisma@localhost:5432/tests',
        REDIS_URL: 'redis://localhost:6379',
        JWT_SECRET: 'secret',
        NODE_ENV: 'e2e'
      }
    })

    apiProcess.stdout?.on('data', (data) => {
      console.log(data)
    })

    apiProcess.stderr?.on('data', (data) => {
      console.error('API Error:', data)
    })

    console.log('Launching API...')
    setTimeout(() => {
      console.log('API launched')
      resolve()
    }, 10000)
  })
}
