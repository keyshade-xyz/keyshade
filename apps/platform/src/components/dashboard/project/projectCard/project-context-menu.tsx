import React from 'react'
import type { Workspace } from '@keyshade/schema'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator
} from '@/components/ui/context-menu'

interface ProjectContextMenuProps {
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

export default function ProjectContextMenu({
  slug,
  isAuthorizedToEditProjects,
  isAuthorizedToDeleteProjects,
  selectedWorkspace,
  copyToClipboard,
  handleCopyToClipboard,
  handleEditProject,
  handleDeleteProject,
  handleExportConfiguration
}: ProjectContextMenuProps): React.JSX.Element {
  return (
    <ContextMenuContent className="w-64">
      <a href={`/${selectedWorkspace.slug}/${slug}?tab=secret`}>
        <ContextMenuItem inset>Open</ContextMenuItem>
      </a>
      <a
        href={`/${selectedWorkspace.slug}/${slug}?tab=secret`}
        rel="noopener noreferrer"
        target="_blank"
      >
        <ContextMenuItem inset>Open in new tab</ContextMenuItem>
      </a>
      <ContextMenuSeparator />
      <ContextMenuItem
        inset
        onClick={() => {
          copyToClipboard(`${window.location.origin}/project/${slug}`)
        }}
      >
        Copy link
      </ContextMenuItem>
      <ContextMenuItem inset onClick={handleCopyToClipboard}>
        Copy slug
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem inset onClick={handleExportConfiguration}>
        Export configuration
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        disabled={!isAuthorizedToEditProjects}
        inset
        onClick={handleEditProject}
      >
        Edit
      </ContextMenuItem>
      <ContextMenuItem
        disabled={!isAuthorizedToDeleteProjects}
        inset
        onClick={handleDeleteProject}
      >
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
