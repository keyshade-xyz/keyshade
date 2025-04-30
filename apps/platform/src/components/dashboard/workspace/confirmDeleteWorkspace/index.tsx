'use client'

import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { useRouter } from 'next/navigation'
import { TrashSVG } from '@public/svg/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import {
  allWorkspacesAtom,
  deleteWorkspaceOpenAtom,
  selectedWorkspaceAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { Input } from '@/components/ui/input'
import { getSelectedWorkspaceFromStorage, setSelectedWorkspaceToStorage } from '@/store/workspace'

export default function ConfirmDeleteWorkspace(): React.JSX.Element {
  const workspaceFromStorage = getSelectedWorkspaceFromStorage()

  const [allWorkspaces, setAllWorkspaces] = useAtom(allWorkspacesAtom)
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useAtom(
    deleteWorkspaceOpenAtom
  )

  const [confirmWorkspaceName, setConfirmWorkspaceName] = useState('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  const deleteWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.deleteWorkspace({
      workspaceSlug: selectedWorkspace!.slug
    })
  )

  const handleDeleteWorkspace = async () => {
    if (selectedWorkspace) {
      setIsLoading(true)
      toast.loading('Deleting workspace...')

      try {
        const { success } = await deleteWorkspace()

        if (success) {
          toast.success('Workspace deleted successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                The workspace has been deleted.
              </p>
            )
          })

          const remainingWorkspaces = allWorkspaces.filter(
            (workspace) => workspace.id !== selectedWorkspace.id
          )
          setAllWorkspaces(remainingWorkspaces)

          if (workspaceFromStorage?.id === selectedWorkspace.id) {
            setSelectedWorkspaceToStorage(remainingWorkspaces[0]);
          }

          setSelectedWorkspace(remainingWorkspaces[0])
        }
      } finally {
        handleClose()
        setIsLoading(false)
        toast.dismiss()
        router.push('/')
      }
    }
  }

  const handleClose = useCallback(() => {
    setIsDeleteWorkspaceOpen(false)
  }, [setIsDeleteWorkspaceOpen])

  return (
    <AlertDialog
      aria-hidden={!isDeleteWorkspaceOpen}
      open={isDeleteWorkspaceOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you want to delete this workspace?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your
            workspace and remove your environment data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex w-full flex-col gap-y-5 text-sm">
          To confirm that you really want to delete this workspace, please type
          in the name of the workspace below.
          <Input
            className="w-full"
            disabled={isLoading}
            onChange={(e) => setConfirmWorkspaceName(e.target.value)}
            placeholder={selectedWorkspace?.name}
            type="text"
            value={confirmWorkspaceName}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-[#DC2626] text-white hover:bg-[#DC2626]/80"
            disabled={
              isLoading ||
              allWorkspaces.length === 1 ||
              confirmWorkspaceName !== selectedWorkspace?.name
            }
            onClick={handleDeleteWorkspace}
          >
            Yes, delete the workspace
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
