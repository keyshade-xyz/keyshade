import type { Variable } from '@keyshade/schema'
import { useSetAtom } from 'jotai'
import { AccordionItem } from '@/components/ui/accordion'
import { ContextMenu } from '@/components/ui/context-menu'
import {
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  selectedVariableAtom,
  variableRevisionsOpenAtom
} from '@/store'
import { copyToClipboard } from '@/lib/clipboard'
import VariableCardHeader from '@/components/dashboard/variable/variableCard/variable-card-header'
import VariableCardContent from '@/components/dashboard/variable/variableCard/variable-card-content'
import VariableCardFooter from '@/components/dashboard/variable/variableCard/variable-card-footer'
import VariableContextMenu from '@/components/dashboard/variable/variableCard/variable-context-menu'

interface VariableCardProps {
  variableData: Variable
  className?: string
}

export default function VariableCard({
  variableData,
  className
}: VariableCardProps): React.JSX.Element {
  const setSelectedVariable = useSetAtom(selectedVariableAtom)
  const setIsEditVariableOpen = useSetAtom(editVariableOpenAtom)
  const setIsDeleteVariableOpen = useSetAtom(deleteVariableOpenAtom)

  const setIsVariableRevisionsOpen = useSetAtom(variableRevisionsOpenAtom)

  const handleCopyToClipboard = () => {
    copyToClipboard(
      variableData.slug,
      'You copied the slug successfully.',
      'Failed to copy the slug.',
      'You successfully copied the slug.'
    )
  }

  const isAuthorizedToEditVariables = variableData.entitlements.canUpdate
  const isAuthorizedToDeleteVariables = variableData.entitlements.canDelete

  const handleEditClick = () => {
    setSelectedVariable(variableData)
    setIsEditVariableOpen(true)
  }

  const handleDeleteClick = () => {
    setSelectedVariable(variableData)
    setIsDeleteVariableOpen(true)
  }

  const handleRevisionsClick = () => {
    setSelectedVariable(variableData)
    setIsVariableRevisionsOpen(true)
  }

  return (
    <ContextMenu>
      <AccordionItem
        className={`bg-night-c hover:bg-night-b border-white/8 rounded-xl border px-4 pb-4 ${className}`}
        id={`variable-${variableData.slug}`}
        key={variableData.id}
        value={variableData.id}
      >
        <VariableCardHeader
          handleCopyToClipboard={handleCopyToClipboard}
          handleDeleteClick={handleDeleteClick}
          handleEditClick={handleEditClick}
          handleRevisionsClick={handleRevisionsClick}
          variableData={variableData}
        />
        <VariableCardContent variableData={variableData} />
        <VariableCardFooter variableData={variableData} />
      </AccordionItem>
      <VariableContextMenu
        handleCopyToClipboard={handleCopyToClipboard}
        handleDeleteClick={handleDeleteClick}
        handleEditClick={handleEditClick}
        handleRevisionsClick={handleRevisionsClick}
        isAuthorizedToDeleteVariables={isAuthorizedToDeleteVariables}
        isAuthorizedToEditVariables={isAuthorizedToEditVariables}
      />
    </ContextMenu>
  )
}
