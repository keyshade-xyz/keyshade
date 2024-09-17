import type {
  PrivateKeyConfig,
  ProfileConfig,
  ProjectRootConfig
} from '@/types/index.types'
import { existsSync } from 'fs'
import { readFile, writeFile, mkdir } from 'fs/promises'

export const getOsType = (): 'unix' | 'windows' => {
  return process.platform === 'win32' ? 'windows' : 'unix'
}

export const getHomeDirectory = (): string => {
  const osType = getOsType()
  return osType === 'windows' ? 'USERPROFILE' : 'HOME'
}

export const getProfileConfigurationFilePath = () => {
  const home = getHomeDirectory()
  return `${process.env[home]}/.keyshade/profiles.json`
}

export const getPrivateKeyConfigurationFilePath = () => {
  const home = getHomeDirectory()
  return `${process.env[home]}/.keyshade/private-keys.json`
}

export const fetchProfileConfig = async (): Promise<ProfileConfig> => {
  const path = getProfileConfigurationFilePath()

  if (!existsSync(path)) {
    await writeFile(path, '{}', 'utf8')
  }

  return JSON.parse(await readFile(path, 'utf8'))
}

export const fetchPrivateKeyConfig = async (): Promise<PrivateKeyConfig> => {
  const path = getPrivateKeyConfigurationFilePath()

  if (!existsSync(path)) {
    await writeFile(path, '{}', 'utf8')
  }

  return JSON.parse(await readFile(path, 'utf8'))
}

export const fetchProjectRootConfig = async (): Promise<ProjectRootConfig> => {
  const path = './keyshade.json'

  if (!existsSync(path)) {
    throw new Error('Project root configuration not found')
  }

  return JSON.parse(await readFile(path, 'utf8'))
}

export const writeProfileConfig = async (
  config: ProfileConfig
): Promise<void> => {
  const path = getProfileConfigurationFilePath()
  await ensureDirectoryExists(path)
  await writeFile(path, JSON.stringify(config, null, 2), 'utf8')
}

export const writePrivateKeyConfig = async (
  config: PrivateKeyConfig
): Promise<void> => {
  const path = getPrivateKeyConfigurationFilePath()
  await ensureDirectoryExists(path)
  await writeFile(path, JSON.stringify(config, null, 2), 'utf8')
}

export const writeProjectRootConfig = async (
  config: ProjectRootConfig
): Promise<void> => {
  await writeFile('./keyshade.json', JSON.stringify(config, null, 2), 'utf8')
}

const ensureDirectoryExists = async (path: string) => {
  // Create the parent directory if it doesn't exist
  const parentDirectory = path.split('/').slice(0, -1).join('/')
  if (!existsSync(parentDirectory)) {
    await mkdir(parentDirectory, { recursive: true })
  }
}
