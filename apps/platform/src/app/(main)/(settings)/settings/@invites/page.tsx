'use client'

import React, { useCallback, useEffect, useState } from "react"
import type { GetWorkspaceInvitationsResponse } from "@keyshade/schema"
import { toast } from "sonner"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useHttp } from "@/hooks/use-http"
import ControllerInstance from "@/lib/controller-instance"
import { cn } from "@/lib/utils"

function InvitesPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [workspaceInvitations, setWorkspaceInvitations] = useState<GetWorkspaceInvitationsResponse['items']>([])

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
        const updatedWorkspaceInvitations = workspaceInvitations.map(invitation => {
            if (invitation.workspace.slug === workspaceSlug) {
                return {
                    ...invitation,
                    invitationAccepted: true
                }
            }
            return invitation
        })
        setWorkspaceInvitations(updatedWorkspaceInvitations)
        toast.success('Invite accepted successfully')
      }
    } finally {
      toast.dismiss()
      setIsLoading(false)
    }
  }, [acceptWorkspaceInvitation, workspaceInvitations])

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
        <div className="max-w-3xl flex flex-col sm:items-center justify-between gap-y-6">
          {workspaceInvitations.map((invitation) => (
            <React.Fragment key={invitation.workspace.slug}>
              <div className="w-full flex flex-row items-center justify-between py-4">
                <div className="mb-3 sm:mb-0 flex flex-col gap-3">
                  <h3 className="text-lg font-semibold">{invitation.workspace.name}</h3>
                  <p className="text-secondary text-sm">
                    You were invited to join <span className="font-semibold">{invitation.workspace.name}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <Button
                    className={cn("bg-[#F4F4F5] border border-white/10 text-[#09090B] hover:bg-white/90 px-4 py-2 rounded-md text-sm font-medium", {
                        "bg-[#404040] cursor-not-allowed": invitation.invitationAccepted
                    })}
                    disabled={invitation.invitationAccepted}
                    onClick={() => handleAcceptInvite(invitation.workspace.slug)}
                  >
                    {invitation.invitationAccepted ?
                        <div className="flex items-center gap-1">
                            <Check size={12} />
                            <span>Accepted</span>
                        </div> : 'Accept Invite'
                    }
                  </Button>

                  <Button
                    className="bg-neutral-800 border border-white/10 text-white/55 px-4 py-2 rounded-md text-sm font-medium"
                    onClick={() => handleDeclineInvite(invitation.workspace.slug)}
                  >
                    Decline
                  </Button>
                </div>
              </div>
              <Separator className="h-[0.5px] bg-[#E4E4E7]/25" />
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </main>
  )
}

export default InvitesPage