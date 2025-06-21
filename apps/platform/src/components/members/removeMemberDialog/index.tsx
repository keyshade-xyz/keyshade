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
  membersOfWorkspaceAtom,
  removeMemberOpenAtom,
  selectedMemberAtom,
  selectedWorkspaceAtom,
  workspaceMemberCountAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

export default function RemoveMemberDialog() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [selectedMember, setSelectedMember] = useAtom(selectedMemberAtom)
  const setMemberCount = useSetAtom(workspaceMemberCountAtom)
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] =
    useAtom(removeMemberOpenAtom)
  const setMembers = useSetAtom(membersOfWorkspaceAtom)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const removeMember = useHttp(() =>
    ControllerInstance.getInstance().workspaceMembershipController.removeUsers({
      workspaceSlug: currentWorkspace!.slug,
      userEmails: selectedMember!.user.email
    })
  )

  const handleClose = useCallback(() => {
    setIsRemoveMemberOpen(false)
  }, [setIsRemoveMemberOpen])

  const handleRemoveMember = useCallback(async () => {
    if (selectedMember) {
      const { success } = await removeMember()

      setIsLoading(true)
      try {
        if (success) {
          setMemberCount((prevCount) => prevCount - 1)
          toast.success('Member removed successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                Team member &quot;{selectedMember.user.name}&quot; has been
                removed successfully.
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
    removeMember,
    setMembers,
    handleClose,
    selectedMember,
    setSelectedMember,
    setMemberCount
  ])

  return (
    <AlertDialog
      aria-hidden={!isRemoveMemberOpen}
      onOpenChange={handleClose}
      open={isRemoveMemberOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you want to remove the member?
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
            onClick={handleRemoveMember}
          >
            Yes, remove member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
