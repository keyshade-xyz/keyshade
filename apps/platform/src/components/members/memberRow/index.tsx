import type { GetMembersResponse } from '@keyshade/schema'
import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import {
  CloseCircleSVG,
  EditTwoSVG,
  MedalStarSVG,
  UserRemoveSVG
} from '@public/svg/shared'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import AvatarComponent from '@/components/common/avatar'
import { Button } from '@/components/ui/button'
import RoleBadge from '@/components/common/role-badge'

function MemberRow({
  member,
  isInvited,
  onRemoveClick,
  onEditMember,
  onTransferOwnership,
  onResendInvitation,
  onCancelInvitation
}: {
  member: GetMembersResponse['items'][number]
  onRemoveClick?: (member: GetMembersResponse['items'][number]) => void
  onEditMember?: (member: GetMembersResponse['items'][number]) => void
  onTransferOwnership?: (member: GetMembersResponse['items'][number]) => void
  onResendInvitation?: (member: GetMembersResponse['items'][number]) => void
  onCancelInvitation?: (member: GetMembersResponse['items'][number]) => void
  isInvited: boolean
}) {
  const isAdminRole = useMemo(
    () =>
      member.roles.some((role) =>
        role.role.authorities.some(
          (authority) => authority === 'WORKSPACE_ADMIN'
        )
      ),
    [member.roles]
  )

  const isAuthorisedToUpdateRoles = member.entitlements.canUpdateRoles
  const isAuthorisedToTransferOwnership =
    member.entitlements.canTransferOwnershipTo
  const isAuthorisedToRemoveMember = member.entitlements.canRemove
  const isAuthorisedToResendInvitation = member.entitlements.canResendInvitation
  const isAuthorisedToCancelInvitation = member.entitlements.canCancelInvitation

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
        {dayjs(member.user.joinedOn).format('MMM D, YYYY')}
      </TableCell>
      <TableCell className="w-[40%] space-x-2 text-left">
        {member.roles.map((role) => {
          return (
            <RoleBadge color={role.role.colorCode ?? '#7C3AED'} key={role.id}>
              {role.role.name}
            </RoleBadge>
          )
        })}
      </TableCell>
      <TableCell className="text-left opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="flex justify-start gap-0.5">
          <TooltipProvider>
            {isInvited ? (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="hover:bg-white/5 hover:text-white"
                      disabled={!isAuthorisedToResendInvitation}
                      onClick={() => onResendInvitation?.(member)}
                      variant="ghost"
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
                      className="hover:bg-white/5 hover:text-white"
                      disabled={!isAuthorisedToCancelInvitation}
                      onClick={() => onCancelInvitation?.(member)}
                      variant="ghost"
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
              </>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="hover:bg-white/5 hover:text-white"
                      disabled={isAdminRole || !isAuthorisedToRemoveMember}
                      onClick={() => onRemoveClick?.(member)}
                      variant="ghost"
                    >
                      <UserRemoveSVG />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
                    sideOffset={8}
                  >
                    {isAdminRole
                      ? 'Cannot remove workspace admin'
                      : 'Remove member from workspace'}
                    <TooltipArrow className="fill-zinc-700" />
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="hover:bg-white/5 hover:text-white"
                      disabled={!isAuthorisedToUpdateRoles}
                      onClick={() => onEditMember?.(member)}
                      variant="ghost"
                    >
                      <EditTwoSVG />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
                    sideOffset={8}
                  >
                    Edit member roles
                    <TooltipArrow className="fill-zinc-700" />
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="hover:bg-white/5 hover:text-white"
                      disabled={!isAuthorisedToTransferOwnership}
                      onClick={() => onTransferOwnership?.(member)}
                      variant="ghost"
                    >
                      <MedalStarSVG />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent
                    className="rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
                    sideOffset={8}
                  >
                    Transfer workspace ownership
                    <TooltipArrow className="fill-zinc-700" />
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default MemberRow
