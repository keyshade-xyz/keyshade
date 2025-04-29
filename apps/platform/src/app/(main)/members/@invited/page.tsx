'use client'

import React, { useCallback } from 'react'
import dayjs from 'dayjs'
import { CloseCircleSVG } from '@public/svg/shared'
import { useAtom, useAtomValue } from 'jotai'
import type { GetMembersResponse } from '@keyshade/schema'
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
  cancelInviteOpenAtom,
  resendInviteOpenAtom,
  selectedMemberAtom,
  selectedWorkspaceAtom
} from '@/store'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import ControllerInstance from '@/lib/controller-instance'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import CancelInvitationDialog from '@/components/members/cancelInvitationDialog'
import ResendInvitationDialog from '@/components/members/resendInvitationDialog'

function MemberRow({
  member,
  onCancelInvitation,
  onResendInvitation
}: {
  member: GetMembersResponse['items'][number]
  onCancelInvitation: (member: GetMembersResponse['items'][number]) => void
  onResendInvitation: (member: GetMembersResponse['items'][number]) => void
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
        {dayjs(member.createdOn).format('MMM D, YYYY')}
      </TableCell>
      <TableCell className="w-[40%] text-left">
        <div className="flex w-[8rem] items-center justify-center rounded-full border border-purple-200 bg-[#3B0764] px-4 py-2 text-purple-200">
          {member.roles[0].role.name}
        </div>
      </TableCell>
      <TableCell className="text-left opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex justify-start gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="border-none bg-transparent p-1 hover:bg-transparent disabled:bg-transparent"
                  onClick={() => onResendInvitation(member)}
                >
                  Resend
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
                sideOffset={8}
              >
                Resend invitation email to the member
                <TooltipArrow className="fill-zinc-700" />
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className="border-none bg-transparent p-1 hover:bg-transparent disabled:bg-transparent"
                  onClick={() => onCancelInvitation(member)}
                >
                  <CloseCircleSVG />
                </Button>
              </TooltipTrigger>
              <TooltipContent
                className="rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
                sideOffset={8}
              >
                Cancel invitation of the member
                <TooltipArrow className="fill-zinc-700" />
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function InvitedMembersTable(): React.JSX.Element {
  const [selectedMember, setSelectedMember] = useAtom(selectedMemberAtom)
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)

  const [isCancelInvitationOpen, setIsCancelInvitationOpen] =
    useAtom(cancelInviteOpenAtom)
  const [isResendInvitationOpen, setIsResendInvitationOpen] =
    useAtom(resendInviteOpenAtom)

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
  const handleResendInvitation = (
    member: GetMembersResponse['items'][number]
  ): void => {
    setSelectedMember(member)
    setIsResendInvitationOpen(true)
  }

  const renderMemberRow = (member: GetMembersResponse['items'][number]) => {
    return (
      <MemberRow
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

      {/* Resend invitation alert dialog */}
      {isResendInvitationOpen && selectedMember ? (
        <ResendInvitationDialog />
      ) : null}

      {/* Cancel invitation alert dialog */}
      {isCancelInvitationOpen && selectedMember ? (
        <CancelInvitationDialog />
      ) : null}
    </div>
  )
}
