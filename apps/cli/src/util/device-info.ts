/* eslint-disable @typescript-eslint/no-namespace */
import os from 'os'
import path from 'path'
export interface DeviceInfo {
  platform: string
  arch: string
  version: string
  hostname: string
  username: string
  nodeVersion: string
  memory: {
    total: number
    free: number
    used: number
  }
  cpu: {
    model: string
    cores: number
  }
}

/**
 * Namespace for retrieving and determining information about the current device and runtime environment.
 *
 * @example
 * ```ts
 * import { DeviceInfo } from './get-device-info'
 *
 * const { platform, arch, version, hostname, username, nodeVersion, memory, cpu } = DeviceInfo.getDeviceInfo()
 * const isWin = DeviceInfo.isWindows()
 * const isMac = DeviceInfo.isMac()
 */
export namespace DeviceInfo {
  /**
   * Retrieves detailed information about the current device and runtime environment.
   *
   * @returns {DeviceInfo} An object containing platform, architecture, OS version, hostname,
   * username, Node.js version, memory statistics, and CPU details.
   */
  export function getDeviceInfo(): DeviceInfo {
    return {
      platform: os.platform(),
      arch: os.arch(),
      version: os.version(),
      hostname: os.hostname(),
      username: os.userInfo().username,
      nodeVersion: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpu: {
        model: os.cpus()[0].model,
        cores: os.cpus().length
      }
    }
  }

  /**
   * Determines if the current operating system is Windows.
   *
   * @returns {boolean} `true` if the OS is Windows (`win32`), otherwise `false`.
   */
  export function isWindows(): boolean {
    return os.platform() === 'win32'
  }

  /**
   * Determines if the current operating system is macOS.
   *
   * @returns {boolean} `true` if the platform is macOS (`darwin`), otherwise `false`.
   */
  export function isMac(): boolean {
    return os.platform() === 'darwin'
  }

  /**
   * Determines if the current operating system is Linux.
   *
   * @returns {boolean} Returns `true` if the OS is Linux, otherwise `false`.
   */
  export function isLinux(): boolean {
    return os.platform() === 'linux'
  }

  /**
   * Returns the path to the configuration directory for the application,
   * based on the current operating system.
   *
   * - On Windows, it uses the `APPDATA` environment variable if available,
   *   otherwise falls back to the user's home directory, and appends 'keyshade'.
   * - On macOS and Linux, it appends '.keyshade' to the user's home directory.
   *
   * @returns {string} The absolute path to the application's configuration directory.
   */
  export function getConfigDirectory(): string {
    const platform = os.platform()
    const homedir = os.homedir()

    switch (platform) {
      case 'win32':
        return path.join(process.env.APPDATA || homedir, 'keyshade')
      case 'darwin':
        return path.join(homedir, '.keyshade')
      case 'linux':
      default:
        return path.join(homedir, '.keyshade')
    }
  }

  /**
   * Retrieves the current user's shell.
   *
   * @returns The path to the user's shell as a string. If the shell cannot be determined,
   * returns 'unknown'. On Unix-like systems, this typically returns the value of the SHELL
   * environment variable. On Windows, it returns the value of the ComSpec environment variable.
   */
  export function getShell(): string {
    return process.env.SHELL || process.env.ComSpec || 'unknown'
  }

  /**
   * Retrieves the name of the current terminal emulator.
   *
   * This function checks the environment variables `TERM` and `TERM_PROGRAM`
   * to determine the terminal in use. If neither is set, it returns `'unknown'`.
   *
   * @returns {string} The name of the terminal emulator or `'unknown'` if not detected.
   */
  export function getTerminal(): string {
    return process.env.TERM || process.env.TERM_PROGRAM || 'unknown'
  }

  /**
   * Retrieves the current Node.js version information.
   *
   * @returns An object containing the full version string (with 'v' prefix),
   *          and the major, minor, and patch version numbers as numbers.
   *
   * @example
   * ```ts
   * const info = getNodejsVersionInfo();
   * // info.version -> 'v18.16.0'
   * // info.major   -> 18
   * // info.minor   -> 16
   * // info.patch   -> 0
   * ```
   */
  export function getNodejsVersionInfo(): {
    version: string
    major: number
    minor: number
    patch: number
  } {
    const version = process.version.slice(1) // Remove 'v' prefix
    const [major, minor, patch] = version.split('.').map(Number)

    return {
      version: process.version,
      major,
      minor,
      patch
    }
  }
}
