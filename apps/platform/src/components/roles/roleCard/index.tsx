'use client'

import type { AuthorityEnum, WorkspaceRole } from '@keyshade/schema'
import dayjs from 'dayjs'
import { Copy, Pen } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useSetAtom } from 'jotai'
import { TrashWhiteSVG } from '@public/svg/shared'
import { NoteIconSVG } from '@public/svg/secret'
import AvatarComponent from '@/components/common/avatar'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { deleteRoleOpenAtom, editRoleOpenAtom, selectedRoleAtom } from '@/store'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/clipboard'

interface RoleListItemProps {
  role: WorkspaceRole
}

function AuthorityTile({ authority }: { authority: AuthorityEnum }) {
  const formattedAuthority = authority
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')

  return (
    <div className="h-fit w-fit rounded-md border border-cyan-200 bg-cyan-950 px-3 py-2 text-center text-sm text-cyan-200">
      {formattedAuthority}
    </div>
  )
}

function ProjectsAndEnvironmentsTooltip({
  projectsAndEnvironments
}: {
  projectsAndEnvironments: WorkspaceRole['projects']
}) {
  return projectsAndEnvironments.length > 0 ? (
    <div className="px-5 text-sm">
      {projectsAndEnvironments.map(({ project, environments }) => (
        <li key={project.id}>
          {project.name}{' '}
          {environments.length > 0
            ? `(${environments.map((env) => env.name).join(', ')})`
            : ''}
        </li>
      ))}
    </div>
  ) : (
    <span className="text-sm text-white/60">
      No projects and environments associated with this role
    </span>
  )
}

export default function RoleCard({
  role
}: RoleListItemProps): React.JSX.Element {
  const AUTHORITY_DISPLAY_LIMIT = 5
  const hasAuthorities = role.authorities.length > 0

  const [showAllAuthorities, setShowAllAuthorities] = useState(false)

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
    <TableRow className="group h-fit w-full hover:bg-white/5" key={role.id}>
      <TableCell className="flex w-[10.25rem] flex-row items-center gap-x-2 text-base">
        <div
          className="h-2 w-2 rounded-full"
          style={{ background: role.colorCode ? role.colorCode : 'blue' }}
        />
        {role.name}
        {role.description ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <NoteIconSVG className="w-6" />
              </TooltipTrigger>
              <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                <p>{role.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </TableCell>
      <TableCell className="h-full">
        <div className="mt-4 flex h-full flex-wrap items-start">
          {role.members.map((member) => {
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
                        {dayjs(String(member.memberSince)).format(
                          'MMM D, YYYY'
                        )}
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
      <TableCell className="h-full">
        <div className="mt-1 flex h-full flex-wrap items-start gap-2">
          {hasAuthorities ? (
            <>
              {role.authorities
                .slice(0, showAllAuthorities ? role.authorities.length : 5)
                .map((authority) => (
                  <AuthorityTile authority={authority} key={authority} />
                ))}
              {role.authorities.length > AUTHORITY_DISPLAY_LIMIT ? (
                <Button
                  aria-controls="authorities-list"
                  aria-expanded={showAllAuthorities}
                  className="h-auto w-fit justify-start border-none bg-transparent text-blue-300 underline hover:bg-inherit"
                  onClick={() => setShowAllAuthorities(!showAllAuthorities)}
                >
                  {showAllAuthorities ? 'Show less' : 'Show more'}
                </Button>
              ) : null}
            </>
          ) : (
            <span className="text-sm text-white/60">
              No authorities available
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="h-full cursor-pointer text-sm text-white/60 underline">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="flex h-full items-start justify-start">
              {role.projects.length} projects,{' '}
              {role.projects.reduce((a, b) => a + b.environments.length, 0)}{' '}
              environments
            </TooltipTrigger>
            <TooltipContent
              className="rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
              sideOffset={8}
            >
              <ProjectsAndEnvironmentsTooltip
                projectsAndEnvironments={role.projects}
              />
              <TooltipArrow className="fill-zinc-700" />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
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
    </TableRow>
  )
}
