import React from 'react'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator
} from '@/components/ui/context-menu'

interface SecretContextMenuProps {
  isAuthorizedToEditSecrets: boolean
  isAuthorizedToDeleteSecrets: boolean
  handleRevisionsClick: () => void
  handleCopyToClipboard: () => void
  handleEditClick: () => void
  handleDeleteClick: () => void
}

export default function SecretContextMenu({
  isAuthorizedToEditSecrets,
  isAuthorizedToDeleteSecrets,
  handleRevisionsClick,
  handleCopyToClipboard,
  handleEditClick,
  handleDeleteClick
}: SecretContextMenuProps): React.JSX.Element {
  return (
    <ContextMenuContent className="w-64">
      <ContextMenuItem onSelect={handleRevisionsClick}>
        Show Version History
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={handleCopyToClipboard}>
        Copy slug
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        disabled={!isAuthorizedToEditSecrets}
        onSelect={handleEditClick}
      >
        Edit
      </ContextMenuItem>
      <ContextMenuItem
        disabled={!isAuthorizedToDeleteSecrets}
        onSelect={handleDeleteClick}
      >
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
