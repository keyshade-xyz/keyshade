import {
  ProjectRootConfig,
  UserRootConfig
} from '../commands/configure/configure.types'
import { existsSync } from 'fs'
import { readFile, readdir, writeFile } from 'fs/promises'

export const getOsType = (): 'unix' | 'windows' => {
  return process.platform === 'win32' ? 'windows' : 'unix'
}

export const getUserRootConfigurationFilePath = (project: string) => {
  const osType = getOsType()
  const home = osType === 'windows' ? 'USERPROFILE' : 'HOME'
  return `${process.env[home]}/.keyshade/${project}.json`
}

export const fetchProjectRootConfig = async (): Promise<ProjectRootConfig> => {
  const path = `keyshade.json`

  if (!existsSync(path)) {
    throw new Error('Project root configuration not found')
  }

  return JSON.parse(await readFile(path, 'utf8'))
}

export const fetchUserRootConfig = async (
  project: string
): Promise<UserRootConfig> => {
  const path = getUserRootConfigurationFilePath(project)

  if (!existsSync(path)) {
    throw new Error('User root configuration not found for project')
  }

  return JSON.parse(await readFile(path, 'utf8'))
}

export const writeProjectRootConfig = async (
  config: ProjectRootConfig
): Promise<void> => {
  const path = `keyshade.json`
  await writeFile(path, JSON.stringify(config, null, 2), 'utf8')
}

export const writeUserRootConfig = async (
  project: string,
  config: UserRootConfig
): Promise<void> => {
  const path = getUserRootConfigurationFilePath(project)
  await writeFile(path, JSON.stringify(config, null, 2), 'utf8')
}

export const fetchUserRootConfigurationFiles = async (): Promise<string> => {
  const osType = getOsType()
  const home = osType === 'windows' ? 'USERPROFILE' : 'HOME'
  const path = `${process.env[home]}/.keyshade`
  const files = await readdir(path)
  return `- ${files.join('\n- ')}`
}
