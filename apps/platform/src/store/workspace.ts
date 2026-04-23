import type { Workspace } from '@keyshade/schema'

export function setWorkspace(workspaceData: Workspace[]): void {
  const defaultWorkspace =
    workspaceData.find((workspace) => workspace.isDefault) || null
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('defaultWorkspace', JSON.stringify(defaultWorkspace))

    if (getSelectedWorkspaceFromStorage() === null) {
      localStorage.setItem(
        'selectedWorkspace',
        JSON.stringify(defaultWorkspace)
      )
    }
  }
}

export function getSelectedWorkspaceFromStorage(): Workspace | null {
  const selectedWorkspace =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem('selectedWorkspace')
      : null

  if (selectedWorkspace && selectedWorkspace !== 'undefined' && selectedWorkspace !== 'null') {
    try {
      return JSON.parse(selectedWorkspace) as Workspace
    } catch (error) {
      // eslint-disable-next-line no-console -- is used for logging
      console.error("Error parsing selectedWorkspace from localStorage:", error);
      return null;
    }
  }
  return null
}

export function setSelectedWorkspaceToStorage(workspace: Workspace): void {
  localStorage.setItem('selectedWorkspace', JSON.stringify(workspace))
}
