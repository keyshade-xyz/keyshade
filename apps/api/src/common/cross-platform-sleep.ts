import { execSync } from 'child_process';
import { platform } from 'os';

const seconds = 3;
const os = platform();

let command: string;
if (os === 'win32') {
  command = `powershell -command "Start-Sleep -s ${seconds}"`;
} else if (os === 'darwin' || os === 'linux') {
  command = `sleep ${seconds}`;
} else {
  console.error('Unsupported operating system');
  process.exit(1);
}

try {
  execSync(command);
} catch (error) {
  console.error(`Error executing sleep command: ${error}`);
  process.exit(1);
}