import React from 'react'

interface WorkspaceSettingsPageProps {
  params: { workspace: string }
}

export default function WorkspaceSettingsPage({
  params
}: WorkspaceSettingsPageProps): JSX.Element {
  const workspaceSettings = params.workspace
  return <div>{workspaceSettings} settings</div>
}
