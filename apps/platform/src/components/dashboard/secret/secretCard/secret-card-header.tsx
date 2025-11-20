import { MoreHorizontalIcon } from 'lucide-react'
import type { Secret } from '@keyshade/schema'
import {
  DropdownMenu,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import SecretDropdownMenu from '@/components/dashboard/secret/secretCard/secret-dropdown-menu'
import { AccordionTrigger } from '@/components/ui/accordion'
import { ContextMenuTrigger } from '@/components/ui/context-menu'

interface SecretCardHeaderProps {
  secretData: Secret
  handleCopyToClipboard: () => void
  handleDeleteClick: () => void
  handleEditClick: () => void
  handleRevisionsClick: () => void
}

export default function SecretCardHeader({
  secretData,
  handleCopyToClipboard,
  handleDeleteClick,
  handleEditClick,
  handleRevisionsClick
}: SecretCardHeaderProps): React.JSX.Element {
  const isAuthorizedToEditSecrets = secretData.entitlements.canUpdate
  const isAuthorizedToDeleteSecrets = secretData.entitlements.canDelete

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
            <SecretDropdownMenu
              handleCopyToClipboard={handleCopyToClipboard}
              handleDeleteClick={handleDeleteClick}
              handleEditClick={handleEditClick}
              handleRevisionsClick={handleRevisionsClick}
              isAuthorizedToDeleteSecrets={isAuthorizedToDeleteSecrets}
              isAuthorizedToEditSecrets={isAuthorizedToEditSecrets}
            />
          </DropdownMenu>
        }
      >
        <div className="flex flex-col items-start gap-y-1 overflow-hidden">
          <div>{secretData.name}</div>
          <div className="text-sm font-light text-white/70">
            {secretData.note}
          </div>
        </div>
      </AccordionTrigger>
    </ContextMenuTrigger>
  )
}
