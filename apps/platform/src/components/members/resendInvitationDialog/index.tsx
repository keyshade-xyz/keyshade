import React, { useCallback } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import {
  membersOfWorkspaceAtom,
  resendInviteOpenAtom,
  selectedMemberAtom,
  selectedWorkspaceAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

export default function ResendInvitationDialog() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [selectedMember, setSelectedMember] = useAtom(selectedMemberAtom)
  const [isResendInvitationOpen, setIsResendInvitationOpen] =
    useAtom(resendInviteOpenAtom)
  const setMembers = useSetAtom(membersOfWorkspaceAtom)

  const resendInvite = useHttp(() =>
    ControllerInstance.getInstance().workspaceMembershipController.resendInvitation(
      {
        workspaceSlug: currentWorkspace!.slug,
        userEmail: selectedMember!.user.email
      }
    )
  )
  const handleClose = useCallback(() => {
    setIsResendInvitationOpen(false)
  }, [setIsResendInvitationOpen])

  const handleResendInvitation = useCallback(async () => {
    if (selectedMember) {
      const { success } = await resendInvite()

      try {
        if (success) {
          toast.success('Invitation email resent successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                Invitation email has been sent to &quot;
                {selectedMember.user.name}&quot; successfully.
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
        toast.dismiss()
      }
    }
  }, [resendInvite, setMembers, handleClose, selectedMember, setSelectedMember])

  return (
    <Dialog
      aria-hidden={!isResendInvitationOpen}
      onOpenChange={handleClose}
      open={isResendInvitationOpen}
    >
      <DialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <DialogHeader>
          <div className="items-center gap-x-3">
            <DialogTitle className="text-lg font-semibold">
              Resend Invitation
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            Do you want to send{' '}
            <span className="font-semibold text-white">
              {selectedMember?.user.email}
            </span>{' '}
            invitation email again?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            className="mt-5 rounded-md bg-neutral-100 text-black hover:bg-neutral-100/80"
            onClick={handleResendInvitation}
          >
            Resend Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
