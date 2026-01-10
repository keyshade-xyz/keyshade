import React from 'react'
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface SecretDropdownMenuProps {
  isAuthorizedToEditSecrets: boolean
  isAuthorizedToDeleteSecrets: boolean
  handleRevisionsClick: () => void
  handleCopyToClipboard: () => void
  handleEditClick: () => void
  handleDeleteClick: () => void
}

export default function SecretDropdownMenu({
  isAuthorizedToEditSecrets,
  isAuthorizedToDeleteSecrets,
  handleRevisionsClick,
  handleCopyToClipboard,
  handleEditClick,
  handleDeleteClick
}: SecretDropdownMenuProps): React.JSX.Element {
  return (
    <DropdownMenuContent align="start">
      <DropdownMenuGroup>
        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleRevisionsClick()
          }}
        >
          Show Version History
        </DropdownMenuItem>
        <DropdownMenuSeparator />
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
          disabled={!isAuthorizedToEditSecrets}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleEditClick()
          }}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!isAuthorizedToDeleteSecrets}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleDeleteClick()
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  )
}
