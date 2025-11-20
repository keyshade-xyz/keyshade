import React from 'react'
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator
} from '@/components/ui/context-menu'

interface VariableContextMenuProps {
  isAuthorizedToEditVariables: boolean
  isAuthorizedToDeleteVariables: boolean
  handleRevisionsClick: () => void
  handleCopyToClipboard: () => void
  handleEditClick: () => void
  handleDeleteClick: () => void
}

export default function VariableContextMenu({
  isAuthorizedToEditVariables,
  isAuthorizedToDeleteVariables,
  handleRevisionsClick,
  handleCopyToClipboard,
  handleEditClick,
  handleDeleteClick
}: VariableContextMenuProps): React.JSX.Element {
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
        disabled={!isAuthorizedToEditVariables}
        onSelect={handleEditClick}
      >
        Edit
      </ContextMenuItem>
      <ContextMenuItem
        disabled={!isAuthorizedToDeleteVariables}
        onSelect={handleDeleteClick}
      >
        Delete
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
