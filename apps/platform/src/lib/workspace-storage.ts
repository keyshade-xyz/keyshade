import type { Workspace } from '@/types'
import { atom, useAtom } from 'jotai'

const defaultWorkspaceAtom = atom<Workspace | null>(null)
const currentWorkspaceAtom = atom<Workspace | null>(null)

export function setWorkspace(workspaceData: Workspace[]): void {
  const defaultWorkspace =
    workspaceData.find((workspace) => workspace.isDefault) || null

  setDefaultWorkspaceAtom(defaultWorkspace)

  if (getCurrentWorkspace() === null) {
    setCurrentWorkspace(defaultWorkspace!)
  }
}

export function getCurrentWorkspace(): Workspace | null {
  const [currentWorkspace] = useAtom(currentWorkspaceAtom)
  return currentWorkspace
}

export function setCurrentWorkspace(workspace: Workspace): void {
  setCurrentWorkspaceAtom(workspace)
}

//Utility functions
export function setDefaultWorkspaceAtom(workspace: Workspace | null): void {
  const [, setDefaultWorkspace] = useAtom(defaultWorkspaceAtom)
  setDefaultWorkspace(workspace)
}

export function setCurrentWorkspaceAtom(workspace: Workspace | null): void {
  const [, setCurrentWorkspace] = useAtom(currentWorkspaceAtom)
  setCurrentWorkspace(workspace)
}
