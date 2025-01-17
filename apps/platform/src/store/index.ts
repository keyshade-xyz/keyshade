import { atom } from 'jotai'
import type { ProjectWithCount, Workspace } from '@keyshade/schema'

export const authEmailAtom = atom<string>('')
export const currentWorkspaceAtom = atom<Workspace | null>(null)

export const projectsOfWorkspaceAtom = atom<ProjectWithCount[]>([])
export const createProjectDialogOpenAtom = atom<boolean>(false)
export const editProjectSheetOpen = atom<boolean>(false)

