import dayjs from 'dayjs'
import React from 'react'
import type { WorkspaceRole } from '@keyshade/schema'
import AvatarComponent from '@/components/common/avatar'
import { TableCell } from '@/components/ui/table'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface RoleMembersCellProps {
  members: WorkspaceRole['members']
}

function RoleMembersCell({ members }: RoleMembersCellProps) {
  return (
    <TableCell className=" h-fit">
      <div className="flex h-full flex-wrap items-start">
        {members.map((member) => {
          const isInvited = !member.invitationAccepted
          return (
            <TooltipProvider key={member.email}>
              <Tooltip>
                <TooltipTrigger>
                  <AvatarComponent
                    className={` ${isInvited && 'opacity-50'}`}
                    name={member.name || ''}
                    profilePictureUrl={member.profilePictureUrl}
                  />
                </TooltipTrigger>
                <TooltipContent
                  className="flex w-fit items-center justify-between rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
                  sideOffset={8}
                >
                  <AvatarComponent
                    className={`h-10 w-10 ${isInvited ? 'opacity-50' : ''}`}
                    name={member.name || ''}
                    profilePictureUrl={member.profilePictureUrl}
                  />
                  <div className="ml-2 mr-5 flex flex-col">
                    {member.name ? (
                      <div className="font-semibold">{member.name}</div>
                    ) : null}
                    <div className="text-sm">{member.email}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="text-sm text-white/60">
                      {isInvited ? 'Invited' : 'Joined'}
                    </div>
                    <div className="text-sm text-white/60">
                      {dayjs(String(member.memberSince)).format('MMM D, YYYY')}
                    </div>
                  </div>
                  <TooltipArrow className="fill-zinc-700" />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        })}
      </div>
    </TableCell>
  )
}

export default RoleMembersCell
