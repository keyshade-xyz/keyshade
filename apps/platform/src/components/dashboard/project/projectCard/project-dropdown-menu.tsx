import type { Workspace } from '@keyshade/schema'
import Link from 'next/link'
import React from 'react'
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface ProjectDropdownMenuProps {
  selectedWorkspace: Workspace
  slug: string
  isAuthorizedToEditProjects: boolean
  isAuthorizedToDeleteProjects: boolean
  copyToClipboard: (text: string) => void
  handleCopyToClipboard: () => void
  handleEditProject: () => void
  handleDeleteProject: () => void
  handleExportConfiguration: () => void
}

export default function ProjectDropdownMenu({
  slug,
  isAuthorizedToEditProjects,
  isAuthorizedToDeleteProjects,
  selectedWorkspace,
  copyToClipboard,
  handleCopyToClipboard,
  handleEditProject,
  handleDeleteProject,
  handleExportConfiguration
}: ProjectDropdownMenuProps): JSX.Element {
  return (
    <DropdownMenuContent align="start" className="w-64">
      <DropdownMenuGroup>
        <Link href={`/${selectedWorkspace.slug}/${slug}?tab=secret`}>
          <DropdownMenuItem>Open</DropdownMenuItem>
        </Link>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            window.open(
              `/${selectedWorkspace.slug}/${slug}?tab=secret`,
              '_blank',
              'noopener,noreferrer'
            )
          }}
        >
          Open in new tab
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            copyToClipboard(`${window.location.origin}/project/${slug}`)
          }}
        >
          Copy link
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleCopyToClipboard()
          }}
        >
          Copy slug
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleExportConfiguration()
          }}
        >
          Export configuration
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!isAuthorizedToEditProjects}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleEditProject()
          }}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!isAuthorizedToDeleteProjects}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDeleteProject
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  )
}
