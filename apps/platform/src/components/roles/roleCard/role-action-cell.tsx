'use client'
import { TrashWhiteSVG } from '@public/svg/shared'
import { Copy, Pen } from 'lucide-react'
import React, { useCallback } from 'react'
import { useSetAtom } from 'jotai'
import type { WorkspaceRole } from '@keyshade/schema'
import { Button } from '@/components/ui/button'
import { TableCell } from '@/components/ui/table'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { copyToClipboard } from '@/lib/clipboard'
import { deleteRoleOpenAtom, editRoleOpenAtom, selectedRoleAtom } from '@/store'

interface RoleActionCellProps {
  role: WorkspaceRole
}

function RoleActionCell({ role }: RoleActionCellProps) {
  const setSelectedRole = useSetAtom(selectedRoleAtom)
  const setIsDeleteRoleOpen = useSetAtom(deleteRoleOpenAtom)
  const setIsEditRoleOpen = useSetAtom(editRoleOpenAtom)

  const isAuthorisedToEditRole = role.entitlements.canUpdate
  const isAuthorisedToDeleteRole = role.entitlements.canDelete

  const handleDeleteRole = useCallback(() => {
    setSelectedRole(role)
    setIsDeleteRoleOpen(true)
  }, [role, setIsDeleteRoleOpen, setSelectedRole])

  const handleEditRole = useCallback(() => {
    setSelectedRole(role)
    setIsEditRoleOpen(true)
  }, [role, setIsEditRoleOpen, setSelectedRole])

  const isAdminRole = role.authorities.some(
    (authority) => authority === 'WORKSPACE_ADMIN'
  )

  return (
    <TableCell className="flex justify-end gap-1.5 opacity-0 transition-all duration-150 ease-in-out group-hover:opacity-100">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="
                p-3 hover:bg-white/5 hover:text-white"
              onClick={() =>
                copyToClipboard(
                  String(role.slug),
                  'The slug got copied to your clipboard.',
                  'Failed to copy slug'
                )
              }
              variant="ghost"
            >
              <Copy size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent
            className="rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
            sideOffset={8}
          >
            Copy the role slug to your clipboard.
            <TooltipArrow className="fill-zinc-700" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Button
        className="p-3 hover:bg-white/5 hover:text-white"
        disabled={!isAuthorisedToEditRole}
        onClick={handleEditRole}
        variant="ghost"
      >
        <Pen size={16} />
      </Button>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="p-3 hover:bg-white/5 hover:text-white"
              disabled={isAdminRole || !isAuthorisedToDeleteRole}
              onClick={handleDeleteRole}
              variant="ghost"
            >
              <TrashWhiteSVG className="h-4 w-4" viewBox="0 0 22 22" />
            </Button>
          </TooltipTrigger>
          {isAdminRole ? (
            <TooltipContent
              className="rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
              sideOffset={8}
            >
              You can not delete a workspace admin role
              <TooltipArrow className="fill-zinc-700" />
            </TooltipContent>
          ) : null}
        </Tooltip>
      </TooltipProvider>
    </TableCell>
  )
}

export default RoleActionCell
