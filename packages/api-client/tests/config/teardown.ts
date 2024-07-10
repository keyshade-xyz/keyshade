import { exec } from 'child_process'

export default async function teardown() {
  await executeCommand('docker compose -f ../../docker-compose-test.yml down')
  process.exit(0)
}

function executeCommand(command: string): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      console.log('Executing: ', command)
      if (error) {
        console.error('Error:', stderr)
        reject(error)
      } else {
        console.log('Output:', stdout)
        resolve()
      }
    })
  })
}
