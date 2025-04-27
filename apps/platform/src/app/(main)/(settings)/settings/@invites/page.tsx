'use client'

import React, { useEffect, useState } from "react"
import type { GetWorkspaceInvitationsResponse } from "@keyshade/schema"
import { useHttp } from "@/hooks/use-http"
import ControllerInstance from "@/lib/controller-instance"
import InviteCard from "@/components/userSettings/workspace/inviteCard"
import { Skeleton } from "@/components/ui/skeleton"

function InvitesPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [workspaceInvitations, setWorkspaceInvitations] = useState<GetWorkspaceInvitationsResponse['items']>([])

  const getAllWorkspaceInvites = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.getWorkspaceInvitations({})
  )

  useEffect(() => {
    setIsLoading(true)
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

      {isLoading ? (
        <div className="flex flex-col gap-y-4">
          <Skeleton className="h-14 max-w-3xl" />
          <Skeleton className="h-14 max-w-3xl" />
          <Skeleton className="h-14 max-w-3xl" />
        </div>
      ) : (
        <div className="max-w-3xl flex flex-col sm:items-center justify-between gap-y-6">
          {workspaceInvitations.map((invitation) => (
            <div className="w-full" key={invitation.workspace.slug}>
              <InviteCard
                invitation={invitation}
                key={invitation.workspace.slug}
                setWorkspaceInvitations={setWorkspaceInvitations}
                workspaceInvitations={workspaceInvitations}
              />
            </div>
          ))}
        </div>
      )}
    </main>
  )
}

export default InvitesPage