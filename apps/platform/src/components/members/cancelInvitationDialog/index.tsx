import React, { useCallback, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
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
  cancelInviteOpenAtom,
  membersOfWorkspaceAtom,
  selectedMemberAtom,
  selectedWorkspaceAtom,
  workspaceMemberCountAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

export default function CancelInvitationDialog() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [selectedMember, setSelectedMember] = useAtom(selectedMemberAtom)
  const setMemberCount = useSetAtom(workspaceMemberCountAtom)
  const [isCancelInvitationOpen, setIsCancelInvitationOpen] =
    useAtom(cancelInviteOpenAtom)
  const setMembers = useSetAtom(membersOfWorkspaceAtom)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const cancelInvite = useHttp(() =>
    ControllerInstance.getInstance().workspaceMembershipController.cancelInvitation(
      {
        workspaceSlug: currentWorkspace!.slug,
        userEmail: selectedMember!.user.email
      }
    )
  )

  const handleClose = useCallback(() => {
    setIsCancelInvitationOpen(false)
  }, [setIsCancelInvitationOpen])

  const handleCancelInvitation = useCallback(async () => {
    if (selectedMember) {
      const { success } = await cancelInvite()

      setIsLoading(true)
      try {
        if (success) {
          setMemberCount((prevCount) => prevCount - 1)
          toast.success('Invitation cancelled successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                The invitation for &quot;{selectedMember.user.name}&quot; has
                been cancelled successfully.
              </p>
            )
          })

          setMembers((prevMembers) =>
            prevMembers.filter(
              (member) => member.user.id !== selectedMember.user.id
            )
          )
          setSelectedMember(null)
          handleClose()
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    cancelInvite,
    setMembers,
    handleClose,
    selectedMember,
    setSelectedMember,
    setMemberCount
  ])

  return (
    <AlertDialog
      aria-hidden={!isCancelInvitationOpen}
      onOpenChange={handleClose}
      open={isCancelInvitationOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you want to cancel member invitation?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. Although, you can share an invite
            again to let them join the team again.
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
            onClick={handleCancelInvitation}
          >
            Yes, cancel invitation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
