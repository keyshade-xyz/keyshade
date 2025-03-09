'use client'

import React from 'react'
import { useAtomValue } from 'jotai'
import { deleteWorkspaceOpenAtom, selectedWorkspaceAtom } from '@/store'
import ConfirmDeleteWorkspace from '@/components/dashboard/workspace/confirmDeleteWorkspace'
import WorkspaceHeaderSection from '@/components/dashboard/workspace/workspaceHeaderSection'
import WorkspaceContentSection from '@/components/dashboard/workspace/workspaceContentSection'
import WorkspaceDeleteSection from '@/components/dashboard/workspace/workspaceDeleteSection'

export default function WorkspaceSettingsPage(): JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const isDeleteWorkspaceOpen = useAtomValue(deleteWorkspaceOpenAtom)

  return (
    <main>
      <WorkspaceHeaderSection />
      <WorkspaceContentSection />
      <WorkspaceDeleteSection />

      {/* Delete workspace alert dialog */}
      {isDeleteWorkspaceOpen && selectedWorkspace ? (
        <ConfirmDeleteWorkspace />
      ) : null}
    </main>
  )
}
