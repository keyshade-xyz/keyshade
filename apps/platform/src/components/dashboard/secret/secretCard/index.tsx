import type { Secret } from '@keyshade/schema'
import { useSetAtom } from 'jotai'
import { AccordionItem } from '@/components/ui/accordion'
import { ContextMenu } from '@/components/ui/context-menu'
import {
  deleteSecretOpenAtom,
  editSecretOpenAtom,
  secretRevisionsOpenAtom,
  selectedSecretAtom
} from '@/store'
import { copyToClipboard } from '@/lib/clipboard'
import SecretContextMenu from '@/components/dashboard/secret/secretCard/secret-context-menu'
import SecretCardHeader from '@/components/dashboard/secret/secretCard/secret-card-header'
import SecretCardContent from '@/components/dashboard/secret/secretCard/secret-card-content'
import SecretCardFooter from '@/components/dashboard/secret/secretCard/secret-card-footer'

interface SecretCardProps {
  secretData: Secret
  privateKey: string | null
  className?: string
}

export default function SecretCard({
  secretData,
  privateKey,
  className
}: SecretCardProps): React.JSX.Element {
  const setSelectedSecret = useSetAtom(selectedSecretAtom)
  const setIsEditSecretOpen = useSetAtom(editSecretOpenAtom)
  const setIsDeleteSecretOpen = useSetAtom(deleteSecretOpenAtom)

  const setIsSecretRevisionsOpen = useSetAtom(secretRevisionsOpenAtom)

  const handleCopyToClipboard = () => {
    copyToClipboard(
      secretData.slug,
      'You copied the slug successfully.',
      'Failed to copy the slug.',
      'You successfully copied the slug.'
    )
  }

  const isAuthorizedToEditSecrets = secretData.entitlements.canUpdate
  const isAuthorizedToDeleteSecrets = secretData.entitlements.canDelete

  const handleEditClick = () => {
    setSelectedSecret(secretData)
    setIsEditSecretOpen(true)
  }

  const handleDeleteClick = () => {
    setSelectedSecret(secretData)
    setIsDeleteSecretOpen(true)
  }

  const handleRevisionsClick = () => {
    setSelectedSecret(secretData)
    setIsSecretRevisionsOpen(true)
  }

  return (
    <ContextMenu>
      <AccordionItem
        className={`bg-night-c hover:bg-night-b border-white/8 rounded-xl border px-4 pb-4 ${className}`}
        id={`secret-${secretData.slug}`}
        key={secretData.id}
        value={secretData.id}
      >
        <SecretCardHeader
          handleCopyToClipboard={handleCopyToClipboard}
          handleDeleteClick={handleDeleteClick}
          handleEditClick={handleEditClick}
          handleRevisionsClick={handleRevisionsClick}
          secretData={secretData}
        />
        <SecretCardContent privateKey={privateKey} secretData={secretData} />
        <SecretCardFooter secretData={secretData} />
      </AccordionItem>
      <SecretContextMenu
        handleCopyToClipboard={handleCopyToClipboard}
        handleDeleteClick={handleDeleteClick}
        handleEditClick={handleEditClick}
        handleRevisionsClick={handleRevisionsClick}
        isAuthorizedToDeleteSecrets={isAuthorizedToDeleteSecrets}
        isAuthorizedToEditSecrets={isAuthorizedToEditSecrets}
      />
    </ContextMenu>
  )
}
