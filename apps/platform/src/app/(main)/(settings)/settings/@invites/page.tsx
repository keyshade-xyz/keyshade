'use client'

import React, { useCallback, useEffect, useState } from "react"
import { useAtom } from "jotai"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useHttp } from "@/hooks/use-http"
import ControllerInstance from "@/lib/controller-instance"
import { workspaceInvitationsAtom } from "@/store"

function InvitesPage(): React.JSX.Element {
  const [workspaceInvitations, setWorkspaceInvitations] = useAtom(workspaceInvitationsAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)

  const getAllWorkspaceInvites = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.getWorkspaceInvitations({})
  )

  const acceptWorkspaceInvitation = useHttp((workspaceSlug: string) =>
    ControllerInstance.getInstance().workspaceMembershipController.acceptInvitation({
      workspaceSlug
    })
  )

  const declineWorkspaceInvitation = useHttp((workspaceSlug: string) =>
    ControllerInstance.getInstance().workspaceMembershipController.declineInvitation({
      workspaceSlug
    })
  )

  const handleAcceptInvite = useCallback(async (workspaceSlug: string) => {
    setIsLoading(true)
    toast.loading('Accepting invite...')
    try {
      const { success } = await acceptWorkspaceInvitation(workspaceSlug)
      if (success) {
        setWorkspaceInvitations(prev =>
          prev.filter(invitation => invitation.workspace.slug !== workspaceSlug)
        )
        toast.success('Invite accepted successfully')
      }
    } finally {
      toast.dismiss()
      setIsLoading(false)
    }
  }, [acceptWorkspaceInvitation, setWorkspaceInvitations])

  const handleDeclineInvite = useCallback(async (workspaceSlug: string) => {
    setIsLoading(true)
    toast.loading('Declining invite...')
    try {
      const { success } = await declineWorkspaceInvitation(workspaceSlug)
      if (success) {
        setWorkspaceInvitations(prev =>
          prev.filter(invitation => invitation.workspace.slug !== workspaceSlug)
        )
        toast.success('Invite declined successfully')
      }
    } finally {
      toast.dismiss()
      setIsLoading(false)
    }
  }, [declineWorkspaceInvitation, setWorkspaceInvitations])

  useEffect(() => {
    getAllWorkspaceInvites()
      .then(({ data, success }) => {
        if (success && data) {
          setWorkspaceInvitations(data.items)
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [getAllWorkspaceInvites, setWorkspaceInvitations])

  return (
    <main className="flex flex-col gap-y-10">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Invites</h1>
        <p className="font-medium text-white/60 mt-2.5">
          View and manage all your workspace invitations.
        </p>
      </div>

      {!isLoading ? (
        <div className="flex flex-col sm:items-center justify-between gap-y-6">
          {workspaceInvitations.map((invitation) => (
            <React.Fragment key={invitation.workspace.slug}>
              <div className="w-full flex flex-row items-center justify-between">
                <div className="mb-3 sm:mb-0">
                  <h3 className="text-lg font-semibold">{invitation.workspace.name}</h3>
                  <p className="text-text-secondary text-sm">
                    {invitation.workspace.name} invited you to join {invitation.workspace.name}
                  </p>
                </div>

                <div className="flex space-x-2">
                  <Button
                    className="bg-[#F4F4F5] border border-white/10 text-[#09090B] hover:bg-white/90 px-4 py-2 rounded-md text-sm font-medium"
                    onClick={() => handleAcceptInvite(invitation.workspace.slug)}
                  >
                    Accept Invite
                  </Button>

                  <Button
                    className="bg-neutral-800 border border-white/10 text-white/55 px-4 py-2 rounded-md text-sm font-medium"
                    onClick={() => handleDeclineInvite(invitation.workspace.slug)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
              <Separator className="bg-[#E4E4E7]" />
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </main>
  )
}

export default InvitesPage