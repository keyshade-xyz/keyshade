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
  let [first, second] = authority.split('_')
  first = first.charAt(0) + first.slice(1).toLowerCase()
  second = second.charAt(0) + second.slice(1).toLowerCase()

  return (
    <div className="h-fit w-full rounded-md border border-cyan-200 bg-cyan-950 px-2 py-1 text-center text-sm text-cyan-200">
      {first} {second}
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
                <NoteIconSVG className="w-7" />
              </TooltipTrigger>
              <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                <p>{role.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : null}
      </TableCell>
      <TableCell className="h-full">
        <div className="flex h-full mt-1 items-start flex-wrap">
          {role.members.map((member) => (
            <TooltipProvider key={member.email}>
              <Tooltip>
                <TooltipTrigger>
                  <AvatarComponent
                    className="ml-[-0.3rem]"
                    name={member.name || ''}
                    profilePictureUrl={member.profilePictureUrl}
                  />
                </TooltipTrigger>
                <TooltipContent
                  className="flex w-fit items-center justify-between rounded-[6px] border-none bg-zinc-700 p-3 text-sm text-white"
                  sideOffset={8}
                >
                  <AvatarComponent
                    className="h-10 w-10"
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
                    <div className="text-sm text-white/60">Joined</div>
                    <div className="text-sm text-white/60">
                      {dayjs(String(member.memberSince)).format('MMM D, YYYY')}
                    </div>
                  </div>
                  <TooltipArrow className="fill-zinc-700" />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </TableCell>
      <TableCell className="h-full">
        <div className="grid h-full grid-cols-2 gap-2">
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
                  className="h-auto justify-start border-none bg-transparent text-blue-300 underline hover:bg-inherit"
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
      <TableCell className="flex justify-end gap-x-4 opacity-0 transition-all duration-150 ease-in-out group-hover:opacity-100">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() =>
                  copyToClipboard(
                    role.slug,
                    'The slug got copied to your clipboard.',
                    'Failed to copy slug'
                  )
                }
                type="button"
              >
                <Copy size={20} />
              </button>
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
        <button onClick={handleEditRole} type="button">
          <Pen size={20} />
        </button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                disabled={isAdminRole}
                onClick={handleDeleteRole}
                type="button"
              >
                <TrashWhiteSVG />
              </button>
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
