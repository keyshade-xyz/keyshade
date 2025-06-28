import { toast } from "sonner"
import type { GetWorkspaceInvitationsResponse } from '@keyshade/schema'
import { Check } from 'lucide-react'
import React, { useCallback, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useHttp } from "@/hooks/use-http"
import ControllerInstance from "@/lib/controller-instance"
import { cn } from "@/lib/utils"

interface InviteCardProps {
    invitation: GetWorkspaceInvitationsResponse['items'][number]
    workspaceInvitations: GetWorkspaceInvitationsResponse['items']
    setWorkspaceInvitations: React.Dispatch<React.SetStateAction<GetWorkspaceInvitationsResponse['items']>>
}

function InviteCard({invitation, workspaceInvitations, setWorkspaceInvitations}: InviteCardProps): React.JSX.Element {
    const [isLoading, setIsLoading] = useState(false)


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
                const updatedWorkspaceInvitations = workspaceInvitations.map(invite =>
                    invite.workspace.slug === workspaceSlug ? { ...invite, invitationAccepted: true } : invite
                );
                setWorkspaceInvitations(updatedWorkspaceInvitations)
                toast.success('Invite accepted successfully')
            }
        } finally {
            toast.dismiss()
            setIsLoading(false)
        }
    }, [acceptWorkspaceInvitation, setWorkspaceInvitations, workspaceInvitations])

    const handleDeclineInvite = useCallback(async (workspaceSlug: string) => {
        setIsLoading(true)
        toast.loading('Declining invite...')
        try {
            const { success } = await declineWorkspaceInvitation(workspaceSlug)
            if (success) {
                setWorkspaceInvitations(prev =>
                    prev.filter(invite => invite.workspace.slug !== workspaceSlug)
                )
                toast.success('Invite declined successfully')
            }
        } finally {
            toast.dismiss()
            setIsLoading(false)
        }
    }, [declineWorkspaceInvitation, setWorkspaceInvitations])

    return (
        <>
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
                    disabled={invitation.invitationAccepted || isLoading}
                    onClick={() => handleAcceptInvite(invitation.workspace.slug)}
                    >
                    {invitation.invitationAccepted ?
                        <div className="flex items-center gap-1">
                            <Check size={16} />
                            <span>Accepted</span>
                        </div> : 'Accept Invite'
                    }
                    </Button>

                    <Button
                    className="bg-neutral-800 border border-white/10 text-white/55 px-4 py-2 rounded-md text-sm font-medium"
                    disabled={invitation.invitationAccepted || isLoading}
                    onClick={() => handleDeclineInvite(invitation.workspace.slug)}
                    >
                    Decline
                    </Button>
                </div>
            </div>
            <Separator className="h-[0.5px] bg-[#E4E4E7]/25" />
        </>
    )
}

export default InviteCard
