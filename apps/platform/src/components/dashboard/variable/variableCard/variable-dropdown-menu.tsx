import React from 'react'
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface VariableDropdownMenuProps {
  isAuthorizedToEditVariables: boolean
  isAuthorizedToDeleteVariables: boolean
  handleRevisionsClick: () => void
  handleCopyToClipboard: () => void
  handleEditClick: () => void
  handleDeleteClick: () => void
}

export default function VariableDropdownMenu({
  isAuthorizedToEditVariables,
  isAuthorizedToDeleteVariables,
  handleRevisionsClick,
  handleCopyToClipboard,
  handleEditClick,
  handleDeleteClick
}: VariableDropdownMenuProps): React.JSX.Element {
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
          disabled={!isAuthorizedToEditVariables}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleEditClick()
          }}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!isAuthorizedToDeleteVariables}
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
