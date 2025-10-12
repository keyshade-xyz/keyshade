import { PermissionBadgeSVG } from '@public/svg/roles'
import { NoteIconSVG } from '@public/svg/secret'
import React from 'react'
import type { WorkspaceRole } from '@keyshade/schema'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { TableCell } from '@/components/ui/table'

interface RoleNameCellProps {
  colorCode: WorkspaceRole['colorCode']
  name: WorkspaceRole['name']
  description?: WorkspaceRole['description']
}

function RoleNameCell({ colorCode, name, description }: RoleNameCellProps) {
  return (
    <TableCell className="flex w-[10.25rem] flex-row items-center gap-x-2 text-base">
      <PermissionBadgeSVG style={{ color: colorCode ? colorCode : 'blue' }} />
      {name}
      {description ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <NoteIconSVG className="w-6" />
            </TooltipTrigger>
            <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : null}
    </TableCell>
  )
}

export default RoleNameCell
