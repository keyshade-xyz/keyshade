'use client'

import React, { useCallback } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import type { GetMembersResponse } from '@keyshade/schema'
import { toast } from 'sonner'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  cancelInviteOpenAtom,
  selectedMemberAtom,
  selectedWorkspaceAtom
} from '@/store'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import ControllerInstance from '@/lib/controller-instance'
import CancelInvitationDialog from '@/components/members/cancelInvitationDialog'
import MemberRow from '@/components/members/memberRow'
import { useHttp } from '@/hooks/use-http'

export default function InvitedMembersTable(): React.JSX.Element {
  const [selectedMember, setSelectedMember] = useAtom(selectedMemberAtom)
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [isCancelInvitationOpen, setIsCancelInvitationOpen] =
    useAtom(cancelInviteOpenAtom)

  const resendInvite = useHttp(() =>
    ControllerInstance.getInstance().workspaceMembershipController.resendInvitation(
      {
        workspaceSlug: currentWorkspace!.slug,
        userEmail: selectedMember!.user.email
      }
    )
  )

  const fetchMembers = useCallback(
    async ({ page, limit }: { page: number; limit: number }) => {
      try {
        const members =
          await ControllerInstance.getInstance().workspaceMembershipController.getMembers(
            {
              workspaceSlug: currentWorkspace!.slug,
              page,
              limit
            },
            {}
          )
        const invited = (members.data?.items ?? []).filter(
          (m) => !m.invitationAccepted
        )
        return {
          success: members.success,
          error: members.error ? { message: members.error.message } : undefined,
          data: {
            items: invited,
            metadata: { totalCount: invited.length }
          }
        }
      } catch (error) {
        return {
          success: false,
          data: { items: [], metadata: { totalCount: 0 } },
          error: {
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    },
    [currentWorkspace]
  )

  const handleCancelInvitation = (
    member: GetMembersResponse['items'][number]
  ): void => {
    setSelectedMember(member)
    setIsCancelInvitationOpen(true)
  }
  const handleResendInvitation = async (
    member: GetMembersResponse['items'][number]
  ) => {
    setSelectedMember(member)
    try {
      const { success } = await resendInvite()
      if (success) {
        toast.success('Invitation email resent successfully', {
          description: (
            <p className="text-xs text-emerald-300">
              Invitation email has been sent to &quot;
              {selectedMember?.user.email}&quot; successfully.
            </p>
          )
        })
      }
    } finally {
      toast.dismiss()
    }
  }

  const renderMemberRow = (member: GetMembersResponse['items'][number]) => {
    return (
      <MemberRow
        isInvited
        key={member.id}
        member={member}
        onCancelInvitation={handleCancelInvitation}
        onResendInvitation={handleResendInvitation}
      />
    )
  }

  return (
    <div className="h-full w-full">
      <div className="w-full">
        <Table className="overflow-hidden rounded-3xl bg-[#1D1D20]">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-left text-sm font-medium text-white">
                Name
              </TableHead>
              <TableHead className="text-left text-sm font-medium text-white">
                Invited On
              </TableHead>
              <TableHead className="text-left text-sm font-medium text-white">
                Roles
              </TableHead>
              <TableHead className="w-[10%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <InfiniteScrollList
              className="contents w-full [&>div]:contents"
              fetchFunction={fetchMembers}
              inTable
              itemComponent={renderMemberRow}
              itemKey={(member) => member.id}
              itemsPerPage={10}
            />
          </TableBody>
        </Table>
      </div>

      {/* Cancel invitation alert dialog */}
      {isCancelInvitationOpen && selectedMember ? (
        <CancelInvitationDialog />
      ) : null}
    </div>
  )
}
