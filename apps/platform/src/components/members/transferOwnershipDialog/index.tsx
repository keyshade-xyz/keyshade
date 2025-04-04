import React, { useCallback, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import type { User } from '@keyshade/schema'
import { toast } from 'sonner'
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
import { selectedMemberAtom, selectedWorkspaceAtom, transferOwnershipOpenAtom } from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

export default function TransferOwnershipDialog() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [selectedMember, setSelectedMember] = useAtom(selectedMemberAtom)
  const [isTransferOwnershipOpen, setIsTransferOwnershipOpen] = useAtom(transferOwnershipOpenAtom)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const transferOwnership = useHttp((userEmail: User['email']) =>
    ControllerInstance.getInstance().workspaceMembershipController.transferOwnership({
      workspaceSlug: currentWorkspace!.slug,
      userEmail
    })
  )

  const handleClose = useCallback(() => {
    setIsTransferOwnershipOpen(false)
  }, [setIsTransferOwnershipOpen])

  const handleTransferOwnership = useCallback(async () => {
    if (selectedMember) {
      const { success } = await transferOwnership()

      setIsLoading(true)
      try {
        if (success) {
          toast.success('Ownership transferred successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                Ownership has been successfully transferred to &quot;{selectedMember.user.name}&quot;
              </p>
            )
          })

          setSelectedMember(null)
          handleClose()
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    handleClose,
    selectedMember,
    setSelectedMember,
    transferOwnership
  ])

  return (
    <AlertDialog
      aria-hidden={!isTransferOwnershipOpen}
      onOpenChange={handleClose}
      open={isTransferOwnershipOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <AlertDialogTitle className="text-lg font-semibold">
              Transfer Ownership?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This will transfer ownership of <span className='text-white'>{currentWorkspace?.name}</span> to <span className='text-white'>{selectedMember?.user.email}</span>. This action cannot be undone.
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
            onClick={handleTransferOwnership}
          >
            Yes, transfer ownership
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
