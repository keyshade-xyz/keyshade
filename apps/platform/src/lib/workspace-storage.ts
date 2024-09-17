import { atom, useAtom } from 'jotai'
import type { Workspace } from '@/types'

const defaultWorkspaceAtom = atom<Workspace | null>(null)
const currentWorkspaceAtom = atom<Workspace | null>(null)

export const useDefaultWorkspace = (): {
  defaultWorkspace: Workspace | null
  setDefaultWorkspace: (workspace: Workspace | null) => void
} => {
  const [defaultWorkspace, setDefaultWorkspace] = useAtom(defaultWorkspaceAtom)
  return { defaultWorkspace, setDefaultWorkspace }
}

export const useCurrentWorkspace = (): {
  currentWorkspace: Workspace | null
  setCurrentWorkspace: (workspace: Workspace | null) => void
} => {
  const [currentWorkspace, setCurrentWorkspace] = useAtom(currentWorkspaceAtom)
  return { currentWorkspace, setCurrentWorkspace }
}

export const SetWorkspace = (workspaceData: Workspace[]): void => {
  const { setDefaultWorkspace } = useDefaultWorkspace()
  const { currentWorkspace, setCurrentWorkspace } = useCurrentWorkspace()

  const defaultWorkspace =
    workspaceData.find((workspace) => workspace.isDefault) || null

  setDefaultWorkspace(defaultWorkspace)

  if (currentWorkspace === null && defaultWorkspace) {
    setCurrentWorkspace(defaultWorkspace)
  }
}

export const GetCurrentWorkspace = (): Workspace | null => {
  const { currentWorkspace } = useCurrentWorkspace()
  return currentWorkspace
}

export const SetCurrentWorkspace = (workspace: Workspace): void => {
  const { setCurrentWorkspace } = useCurrentWorkspace()
  setCurrentWorkspace(workspace)
}

//Utility functions
export const UpdateDefaultWorkspaceAtom = (
  workspace: Workspace | null
): void => {
  const { setDefaultWorkspace } = useDefaultWorkspace()
  setDefaultWorkspace(workspace)
}

export const UpdateCurrentWorkspaceAtom = (
  workspace: Workspace | null
): void => {
  const { setCurrentWorkspace } = useCurrentWorkspace()
  setCurrentWorkspace(workspace)
}
