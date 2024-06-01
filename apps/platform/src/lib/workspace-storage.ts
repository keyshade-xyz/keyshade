import type { Workspace } from '@/types'

export function setWorkspace(workspaceData: Workspace[]): void {
  const defaultWorkspace =
    workspaceData.find((workspace) => workspace.isDefault) || null
  localStorage.setItem('defaultWorkspace', JSON.stringify(defaultWorkspace))
  if (getCurrentWorkspace() === null) {
    localStorage.setItem('currentWorkspace', JSON.stringify(defaultWorkspace))
  }
}

export function getCurrentWorkspace(): Workspace | null {
  const currentWorkspace = localStorage.getItem('currentWorkspace')
  if (currentWorkspace) {
    return JSON.parse(currentWorkspace) as Workspace
  }
  return null
}

export function setCurrentWorkspace(workspace: Workspace): void {
  localStorage.setItem('currentWorkspace', JSON.stringify(workspace))
}