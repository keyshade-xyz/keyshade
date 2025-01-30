import { atom } from 'jotai'
import type {
  GetAllEnvironmentsOfProjectResponse,
  GetAllWorkspacesOfUserResponse,
  Project,
  ProjectWithCount,
  Secret,
  Variable,
} from '@keyshade/schema'

export const authEmailAtom = atom<string>('')

export const selectedWorkspaceAtom = atom<
  GetAllWorkspacesOfUserResponse['items'][number] | null
>(null)
export const selectedProjectAtom = atom<Project | null>(null)
export const selectedVariableAtom = atom<Variable | null>(null)
export const selectedSecretAtom = atom<Secret | null>(null)
export const selectedEnvironmentAtom = atom<
  GetAllEnvironmentsOfProjectResponse['items'][number] | null
>(null)

export const workspacesAtom = atom<GetAllWorkspacesOfUserResponse['items']>([])
export const projectsOfWorkspaceAtom = atom<ProjectWithCount[]>([])
export const environmentsOfProjectAtom = atom<
  GetAllEnvironmentsOfProjectResponse['items']
>([])
export const variablesOfProjectAtom = atom<Variable[]>([])
export const secretsOfProjectAtom = atom<Secret[]>([])

export const createProjectOpenAtom = atom<boolean>(false)
export const editProjectOpenAtom = atom<boolean>(false)
export const deleteProjectOpenAtom = atom<boolean>(false)

export const createVariableOpenAtom = atom<boolean>(false)
export const editVariableOpenAtom = atom<boolean>(false)
export const deleteVariableOpenAtom = atom<boolean>(false)

export const createSecretOpenAtom = atom<boolean>(false)
export const editSecretOpenAtom = atom<boolean>(false)
export const deleteSecretOpenAtom = atom<boolean>(false)

export const createEnvironmentOpenAtom = atom<boolean>(false)
export const editEnvironmentOpenAtom = atom<boolean>(false)
export const deleteEnvironmentOpenAtom = atom<boolean>(false)
