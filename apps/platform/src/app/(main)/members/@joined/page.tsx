'use client'

import React, { useCallback } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import type { GetMembersResponse } from '@keyshade/schema'
import TransferOwnershipDialog from '@/components/members/transferOwnershipDialog'
import RemoveMemberDialog from '@/components/members/removeMemberDialog'
import EditMemberDialog from '@/components/members/editMemberDialog'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  editMemberOpenAtom,
  removeMemberOpenAtom,
  selectedMemberAtom,
  selectedWorkspaceAtom,
  transferOwnershipOpenAtom
} from '@/store'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import ControllerInstance from '@/lib/controller-instance'
import MemberRow from '@/components/members/memberRow'

export default function JoinedMembersTable(): React.JSX.Element {
  const [selectedMember, setSelectedMember] = useAtom(selectedMemberAtom)
  const [isRemoveMemberOpen, setIsRemoveMemberOpen] =
    useAtom(removeMemberOpenAtom)
  const [isTransferOwnershipOpen, setIsTransferOwnershipOpen] = useAtom(
    transferOwnershipOpenAtom
  )
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [isEditMemberOpen, setIsEditMemberOpen] = useAtom(editMemberOpenAtom)

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
        const accepted = (members.data?.items ?? []).filter(
          (m) => m.invitationAccepted
        )
        return {
          success: members.success,
          error: members.error ? { message: members.error.message } : undefined,
          data: {
            items: accepted,
            metadata: { totalCount: accepted.length }
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

  const handleRemoveClick = (
    member: GetMembersResponse['items'][number]
  ): void => {
    setSelectedMember(member)
    setIsRemoveMemberOpen(true)
  }

  const handleTransferOwnership = (
    member: GetMembersResponse['items'][number]
  ): void => {
    setSelectedMember(member)
    setIsTransferOwnershipOpen(true)
  }

  const handleEditMember = (
    member: GetMembersResponse['items'][number]
  ): void => {
    setSelectedMember(member)
    setIsEditMemberOpen(true)
  }

  const renderMemberRow = (member: GetMembersResponse['items'][number]) => {
    return (
      <MemberRow
        isInvited={false}
        key={member.id}
        member={member}
        onEditMember={handleEditMember}
        onRemoveClick={handleRemoveClick}
        onTransferOwnership={handleTransferOwnership}
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
                Joining Date
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

      {/* Remove member alert dialog */}
      {isRemoveMemberOpen && selectedMember ? <RemoveMemberDialog /> : null}

      {/* Transfer ownership alert dialog */}
      {isTransferOwnershipOpen && selectedMember ? (
        <TransferOwnershipDialog />
      ) : null}

      {/* Edit member dialog */}
      {isEditMemberOpen && selectedMember ? <EditMemberDialog /> : null}
    </div>
  )
}
