import { execSync } from 'child_process'
import { platform } from 'os'
import { Logger } from '@nestjs/common'

const logger = new Logger('SleepCommand')
const seconds = 3
const os = platform()

let command: string
if (os === 'win32') {
  command = `powershell -command "Start-Sleep -s ${seconds}"`
} else if (os === 'darwin' || os === 'linux') {
  command = `sleep ${seconds}`
} else {
  logger.error('Unsupported operating system')
  process.exit(1)
}

try {
  logger.log(`Executing sleep command for ${seconds} seconds on ${os}`)
  execSync(command)
  logger.log('Sleep command executed successfully')
} catch (error) {
  logger.error(`Error executing sleep command: ${error}`)
  process.exit(1)
}
