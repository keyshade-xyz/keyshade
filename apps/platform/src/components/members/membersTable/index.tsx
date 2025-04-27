'use client'

import React, { useCallback } from 'react'
import dayjs from 'dayjs'
import { EditTwoSVG, MedalStarSVG, UserRemoveSVG } from '@public/svg/shared'
import { useAtom, useAtomValue } from 'jotai'
import type { GetMembersResponse } from '@keyshade/schema'
import TransferOwnershipDialog from '../transferOwnershipDialog'
import RemoveMemberDialog from '../removeMemberDialog'
import EditMemberDialog from '../editMemberDialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import AvatarComponent from '@/components/common/avatar'
import { Button } from '@/components/ui/button'
import {
  editMemberOpenAtom,
  removeMemberOpenAtom,
  selectedMemberAtom,
  selectedWorkspaceAtom,
  transferOwnershipOpenAtom
} from '@/store'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import ControllerInstance from '@/lib/controller-instance'

function MemberRow({
  member,
  onRemoveClick,
  onEditMember,
  onTransferOwnership
}: {
  member: GetMembersResponse['items'][number]
  onRemoveClick: (member: GetMembersResponse['items'][number]) => void
  onEditMember: (member: GetMembersResponse['items'][number]) => void
  onTransferOwnership: (member: GetMembersResponse['items'][number]) => void
}) {
  return (
    <TableRow className="group hover:bg-transparent" key={member.id}>
      <TableCell className="w-[30%] text-left">
        <div className="flex items-center">
          <AvatarComponent
            className="h-10 w-10"
            name={member.user.name || ''}
            profilePictureUrl={member.user.profilePictureUrl}
          />
          <div className="ml-3">
            <div className="text-base font-medium text-white">
              {member.user.name}
            </div>
            <div className="text-xs font-normal text-white">
              {member.user.email}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="w-[30%] text-left">
        {member.invitationAccepted ? (
          dayjs(member.createdOn).format('MMM D, YYYY')
        ) : (
          <p className="text-yellow-400">Pending</p>
        )}
      </TableCell>
      <TableCell className="w-[40%] text-left">
        <div className="flex w-[8rem] items-center justify-center rounded-full border border-purple-200 bg-[#3B0764] px-4 py-2 text-purple-200">
          {member.roles[0].role.name}
        </div>
      </TableCell>
      <TableCell className="text-left opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex justify-start gap-2">
          <Button
            className="border-none bg-transparent p-1 hover:bg-transparent"
            onClick={() => onRemoveClick(member)}
          >
            <UserRemoveSVG />
          </Button>
          <Button
            className="border-none bg-transparent p-1 hover:bg-transparent"
            onClick={() => onEditMember(member)}
          >
            <EditTwoSVG />
          </Button>
          <Button
            className="border-none bg-transparent p-1 hover:bg-transparent"
            onClick={() => onTransferOwnership(member)}
          >
            <MedalStarSVG />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function MembersTable(): React.JSX.Element {
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
        return {
          success: members.success,
          error: members.error ? { message: members.error.message } : undefined,
          data: members.data ?? { items: [], metadata: { totalCount: 0 } }
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
