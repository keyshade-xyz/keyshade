import { MoreHorizontalIcon } from 'lucide-react'
import type { Variable } from '@keyshade/schema'
import {
  DropdownMenu,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import VariableDropdownMenu from '@/components/dashboard/variable/variableCard/variable-dropdown-menu'
import { AccordionTrigger } from '@/components/ui/accordion'
import { ContextMenuTrigger } from '@/components/ui/context-menu'

interface VariableCardHeaderProps {
  variableData: Variable
  handleCopyToClipboard: () => void
  handleDeleteClick: () => void
  handleEditClick: () => void
  handleRevisionsClick: () => void
}

export default function VariableCardHeader({
  variableData,
  handleCopyToClipboard,
  handleDeleteClick,
  handleEditClick,
  handleRevisionsClick
}: VariableCardHeaderProps): React.JSX.Element {
  const isAuthorizedToEditVariables = variableData.entitlements.canUpdate
  const isAuthorizedToDeleteVariables = variableData.entitlements.canDelete

  return (
    <ContextMenuTrigger>
      <AccordionTrigger
        className="w-full overflow-hidden hover:no-underline"
        rightChildren={
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className="cursor-pointer"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                type="button"
              >
                <MoreHorizontalIcon />
              </button>
            </DropdownMenuTrigger>
            <VariableDropdownMenu
              handleCopyToClipboard={handleCopyToClipboard}
              handleDeleteClick={handleDeleteClick}
              handleEditClick={handleEditClick}
              handleRevisionsClick={handleRevisionsClick}
              isAuthorizedToDeleteVariables={isAuthorizedToDeleteVariables}
              isAuthorizedToEditVariables={isAuthorizedToEditVariables}
            />
          </DropdownMenu>
        }
      >
        <div className="flex flex-col items-start gap-y-1 overflow-hidden">
          <div>{variableData.name}</div>
          <div className="text-sm font-light text-white/70">
            {variableData.note}
          </div>
        </div>
      </AccordionTrigger>
    </ContextMenuTrigger>
  )
}
