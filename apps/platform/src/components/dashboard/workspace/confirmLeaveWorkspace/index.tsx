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
  leaveWorkspaceOpenAtom,
  selectedWorkspaceAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { Input } from '@/components/ui/input'

export default function ConfirmLeaveWorkspace(): React.JSX.Element {
  const [allWorkspaces, setAllWorkspaces] = useAtom(allWorkspacesAtom)
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(
    selectedWorkspaceAtom
  )
  const [isLeaveWorkspaceOpen, setIsLeaveWorkspaceOpen] = useAtom(
    leaveWorkspaceOpenAtom
  )

  const [confirmWorkspaceName, setConfirmWorkspaceName] = useState('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  const leaveWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceMembershipController.leaveWorkspace(
      {
        workspaceSlug: selectedWorkspace!.slug
      }
    )
  )

  const handleLeaveWorkspace = async () => {
    if (selectedWorkspace) {
      setIsLoading(true)
      toast.loading('Leaving workspace...')

      try {
        const { success } = await leaveWorkspace()

        if (success) {
          toast.success('Workspace left successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                You are no longer a member of this workspace.
              </p>
            )
          })

          const remainingWorkspaces = allWorkspaces.filter(
            (workspace) => workspace.id !== selectedWorkspace.id
          )
          setAllWorkspaces(remainingWorkspaces)
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
    setIsLeaveWorkspaceOpen(false)
  }, [setIsLeaveWorkspaceOpen])

  return (
    <AlertDialog
      aria-hidden={!isLeaveWorkspaceOpen}
      open={isLeaveWorkspaceOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you want to leave this workspace?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. You will loss the access to this
            workspace.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex w-full flex-col gap-y-5 text-sm">
          To confirm that you really want to leave this workspace, please type
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
            onClick={handleLeaveWorkspace}
          >
            Yes, leave the workspace
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
