import { FolderIconSVG } from '@public/svg/dashboard'
import { useSetAtom } from 'jotai'
import React from 'react'
import { createProjectOpenAtom } from '@/store'
import { Button } from '@/components/ui/button'

export default function EmptyProjectsState() {
  const setIsCreateProjectDialogOpen = useSetAtom(createProjectOpenAtom)
  return (
    <div className="mt-[10vh] flex h-[40vh] flex-col items-center justify-center gap-y-4">
      <FolderIconSVG width="100" />
      <div className="text-4xl">Start your First Project</div>
      <div>
        Create a project and start setting up your variables and secret keys
      </div>
      <Button
        onClick={() => setIsCreateProjectDialogOpen(true)}
        variant="secondary"
      >
        Create project
      </Button>
    </div>
  )
}
