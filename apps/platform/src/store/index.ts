import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import type {
  ApiKey,
  GetAllEnvironmentsOfProjectResponse,
  Project,
  ProjectWithCount,
  Secret,
  User,
  Variable,
  Workspace
} from '@keyshade/schema'

export const userAtom = atomWithStorage<Partial<User> | null>('user', null)

export const selectedWorkspaceAtom = atom<
  (Workspace & { projects: number }) | null
>(null)
export const selectedProjectAtom = atom<Project | null>(null)
export const selectedVariableAtom = atom<Variable | null>(null)
export const selectedVariableEnvironmentAtom = atom<string | null>(null)
export const selectedSecretAtom = atom<Secret | null>(null)
export const selectedSecretEnvironmentAtom = atom<string | null>(null)
export const selectedEnvironmentAtom = atom<
  GetAllEnvironmentsOfProjectResponse['items'][number] | null
>(null)
export const selectedApiKeyAtom = atom<ApiKey | null>(null)
export const projectsOfWorkspaceAtom = atom<ProjectWithCount[]>([])
export const environmentsOfProjectAtom = atom<
  GetAllEnvironmentsOfProjectResponse['items']
>([])
export const variablesOfProjectAtom = atom<Variable[]>([])
export const secretsOfProjectAtom = atom<Secret[]>([])
export const apiKeysOfProjectAtom = atom<ApiKey[]>([])

export const createProjectOpenAtom = atom<boolean>(false)
export const editProjectOpenAtom = atom<boolean>(false)
export const deleteProjectOpenAtom = atom<boolean>(false)

export const createVariableOpenAtom = atom<boolean>(false)
export const editVariableOpenAtom = atom<boolean>(false)
export const deleteVariableOpenAtom = atom<boolean>(false)
export const deleteEnvironmentValueOfVariableOpenAtom = atom<boolean>(false)

export const createSecretOpenAtom = atom<boolean>(false)
export const editSecretOpenAtom = atom<boolean>(false)
export const deleteSecretOpenAtom = atom<boolean>(false)
export const deleteEnvironmentValueOfSecretOpenAtom = atom<boolean>(false)

export const createEnvironmentOpenAtom = atom<boolean>(false)
export const editEnvironmentOpenAtom = atom<boolean>(false)
export const deleteEnvironmentOpenAtom = atom<boolean>(false)

export const createApiKeyOpenAtom = atom<boolean>(false)
export const editApiKeyOpenAtom = atom<boolean>(false)
export const deleteApiKeyOpenAtom = atom<boolean>(false)

export const deleteAccountOpenAtom = atom<boolean>(false)
