'use client'

import React, { useEffect, useState } from 'react'
import type { GetWorkspaceInvitationsResponse } from '@keyshade/schema'
import { InvitationSVG } from '@public/svg/shared'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import InviteCard from '@/components/userSettings/workspace/inviteCard'
import { Skeleton } from '@/components/ui/skeleton'

function InvitesPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [workspaceInvitations, setWorkspaceInvitations] = useState<
    GetWorkspaceInvitationsResponse['items']
  >([])

  const getAllWorkspaceInvites = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.getWorkspaceInvitations(
      {}
    )
  )
  const hasInvitations = workspaceInvitations.length > 0

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
        <p className="mt-2.5 font-medium text-white/60">
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
        <div className="flex max-w-3xl flex-col justify-between gap-y-6 sm:items-center">
          {hasInvitations ? (
            workspaceInvitations.map((invitation) => (
              <div className="w-full" key={invitation.workspace.slug}>
                <InviteCard
                  invitation={invitation}
                  key={invitation.workspace.slug}
                  setWorkspaceInvitations={setWorkspaceInvitations}
                  workspaceInvitations={workspaceInvitations}
                />
              </div>
            ))
          ) : (
            <div className="flex w-full flex-col items-center justify-center rounded-lg border border-white/10 bg-neutral-900 py-10">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-neutral-800">
                  <InvitationSVG />
                </div>
                <h3 className="text-lg font-semibold text-white/90">
                  No pending invitations
                </h3>
                <p className="text-secondary mt-1 max-w-md text-center text-sm text-white/55">
                  You don&apos;t have any workspace invitations at the moment.
                  Invitations will appear here when someone invites you to join
                  their workspace.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  )
}

export default InvitesPage
