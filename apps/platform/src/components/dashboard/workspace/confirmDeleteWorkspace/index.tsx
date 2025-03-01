'use client'

import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAtom } from 'jotai'
import { TrashSVG } from '@public/svg/shared'
import { useRouter } from 'next/navigation'
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
import { deleteWorkspaceOpenAtom, selectedWorkspaceAtom } from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'

export default function ConfirmDeleteWorkspace(): React.JSX.Element {
  const [selectedWorkspace, setSelectedWorkspace] = useAtom(selectedWorkspaceAtom)
  const [isDeleteWorkspaceOpen, setIsDeleteWorkspaceOpen] = useAtom(deleteWorkspaceOpenAtom)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const router = useRouter()

  const deleteWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.deleteWorkspace({
      workspaceSlug: selectedWorkspace!.slug
    })
  );

  const handleDeleteWorkspace = async () => {
    // Delete workspace logic goes here
    if (selectedWorkspace) {
      setIsLoading(true)
      toast.loading('Deleting workspace...')

      try {
        const { success } = await deleteWorkspace()

        if (success) {
          toast.success('Environment workspace successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                The environment has been deleted.
              </p>
            )
          })

          // Set the selected environment to null
          setSelectedWorkspace(null)
          handleClose()
        }
      } finally {
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
      onOpenChange={handleClose}
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
            This action cannot be undone. This will permanently delete your workspace and remove your environment data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-[#DC2626] text-white hover:bg-[#DC2626]/80"
            disabled={isLoading}
            onClick={handleDeleteWorkspace}
          >
            Yes, delete the wokspace
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
