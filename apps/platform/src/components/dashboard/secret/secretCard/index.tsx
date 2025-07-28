import type { Environment, Secret } from '@keyshade/schema'
import dayjs from 'dayjs'
import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { decrypt } from '@keyshade/common'
import { NoteIconSVG } from '@public/svg/secret'
import { TrashWhiteSVG, EyeOpenSVG, EyeSlashSVG } from '@public/svg/shared'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/components/ui/context-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  deleteEnvironmentValueOfSecretOpenAtom,
  deleteSecretOpenAtom,
  editSecretOpenAtom,
  secretRevisionsOpenAtom,
  selectedSecretAtom,
  selectedSecretEnvironmentAtom
} from '@/store'
import AvatarComponent from '@/components/common/avatar'
import { copyToClipboard } from '@/lib/clipboard'

interface SecretCardProps {
  secretData: Secret
  privateKey: string | null
  className?: string
}

export default function SecretCard({
  secretData,
  privateKey,
  className
}: SecretCardProps) {
  const { versions } = secretData

  const setSelectedSecret = useSetAtom(selectedSecretAtom)
  const setIsEditSecretOpen = useSetAtom(editSecretOpenAtom)
  const setIsDeleteSecretOpen = useSetAtom(deleteSecretOpenAtom)
  const setIsDeleteEnvironmentValueOfSecretOpen = useSetAtom(
    deleteEnvironmentValueOfSecretOpenAtom
  )
  const setIsSecretRevisionsOpen = useSetAtom(secretRevisionsOpenAtom)
  const [selectedSecretEnvironment, setSelectedSecretEnvironment] = useAtom(
    selectedSecretEnvironmentAtom
  )
  const [isSecretRevealed, setIsSecretRevealed] = useState<boolean>(false)
  const [decryptedValues, setDecryptedValues] = useState<
    Record<Environment['id'], string>
  >({})

  const isAuthorizedToEditSecrets = secretData.entitlements.canUpdate
  const isAuthorizedToDeleteSecrets = secretData.entitlements.canDelete

  const handleDecryptValues = useCallback(
    (environmentSlug: Environment['slug']) => {
      if (!privateKey) return
      const targetValue = versions.find(
        (value) => value.environment.slug === environmentSlug
      )
      if (!targetValue) return

      decrypt(privateKey, targetValue.value)
        .then((decrypted) => {
          setDecryptedValues((prev) => ({
            ...prev,
            [targetValue.environment.id]: decrypted
          }))
        })
        .catch((error) => {
          // eslint-disable-next-line no-console -- console.error is used for debugging
          console.error('Decryption error:', error)
          setDecryptedValues((prev) => ({
            ...prev,
            [targetValue.environment.id]: 'Decryption failed'
          }))
        })
    },
    [privateKey, versions]
  )

  useEffect(() => {
    handleDecryptValues(secretData.versions[0]?.environment.slug)
  }, [secretData.versions, handleDecryptValues])

  const handleCopyToClipboard = () => {
    copyToClipboard(
      secretData.slug,
      'You copied the slug successfully.',
      'Failed to copy the slug.',
      'You successfully copied the slug.'
    )
  }
  const handleRevealEnvironmentValueOfSecretClick = (
    environment: Environment['slug']
  ) => {
    if (selectedSecretEnvironment === environment && isSecretRevealed) {
      setIsSecretRevealed(false)
    } else {
      setIsSecretRevealed(true)
      handleDecryptValues(environment)
    }
    setSelectedSecretEnvironment(environment)
  }

  const handleEditClick = () => {
    setSelectedSecret(secretData)
    setIsEditSecretOpen(true)
  }

  const handleDeleteClick = () => {
    setSelectedSecret(secretData)
    setIsDeleteSecretOpen(true)
  }

  const handleDeleteEnvironmentValueOfSecretClick = (
    environment: Environment['slug']
  ) => {
    setSelectedSecret(secretData)
    setSelectedSecretEnvironment(environment)
    setIsDeleteEnvironmentValueOfSecretOpen(true)
  }

  const handleRevisionsClick = () => {
    setSelectedSecret(secretData)
    setIsSecretRevisionsOpen(true)
  }

  return (
    <ContextMenu>
      <AccordionItem
        className={`rounded-xl bg-white/5 px-5 ${className}`}
        id={`secret-${secretData.slug}`}
        key={secretData.id}
        value={secretData.id}
      >
        <ContextMenuTrigger>
          <AccordionTrigger
            className="overflow-hidden hover:no-underline"
            rightChildren={
              <div className="flex items-center gap-x-4 text-xs text-white/50">
                {dayjs(secretData.updatedAt).toNow(true)} ago by{' '}
                <div className="flex items-center gap-x-2">
                  <span className="text-white">
                    {secretData.lastUpdatedBy.name}
                  </span>
                  <AvatarComponent
                    name={secretData.lastUpdatedBy.name}
                    profilePictureUrl={
                      secretData.lastUpdatedBy.profilePictureUrl
                    }
                  />
                </div>
              </div>
            }
          >
            <div className="mr-5 flex flex-1 gap-x-5 overflow-hidden">
              <div className="flex items-center gap-x-4 truncate">
                {/* <SecretLogoSVG /> */}
                {secretData.name}
              </div>
              {secretData.note ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <NoteIconSVG className="w-7" />
                    </TooltipTrigger>
                    <TooltipContent className="border-white/20 bg-white/10 text-white backdrop-blur-xl">
                      <p>{secretData.note}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </AccordionTrigger>
        </ContextMenuTrigger>
        <AccordionContent>
          {versions.length > 0 ? (
            <Table className="h-full w-full">
              <TableHeader className="h-[3.125rem] w-full">
                <TableRow className="h-[3.125rem] w-full bg-white/10">
                  <TableHead className="h-full w-[10.25rem] rounded-tl-xl text-base font-normal text-white/50">
                    Environment
                  </TableHead>
                  <TableHead className="h-full text-base font-normal text-white/50">
                    Value
                  </TableHead>
                  <TableHead className="h-full rounded-tr-xl text-base font-normal text-white/50">
                    Version
                  </TableHead>
                  <TableHead className="h-full w-[100px] rounded-tr-xl text-base font-normal text-white/50" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {versions.map((value) => {
                  const isRevealed =
                    isSecretRevealed &&
                    value.environment.slug === selectedSecretEnvironment
                  return (
                    <TableRow
                      className="group h-[3.125rem] w-full hover:bg-white/5"
                      key={value.environment.id}
                    >
                      <TableCell className="h-full w-[10.25rem] text-base">
                        {value.environment.name}
                      </TableCell>
                      <TableCell className="h-full text-base">
                        {isRevealed
                          ? decryptedValues[value.environment.id]
                          : value.value.replace(/./g, '*').substring(0, 20)}
                      </TableCell>
                      <TableCell className="h-full px-8 py-4 text-base">
                        {value.version}
                      </TableCell>
                      <TableCell className="h-full px-8 py-4 text-base opacity-0 transition-all duration-150 ease-in-out group-hover:opacity-100">
                        <div className="flex gap-3">
                          {privateKey ? (
                            <button
                              className="duration-300 hover:scale-105"
                              onClick={() =>
                                handleRevealEnvironmentValueOfSecretClick(
                                  value.environment.slug
                                )
                              }
                              type="button"
                            >
                              {!isRevealed ? <EyeOpenSVG /> : <EyeSlashSVG />}
                            </button>
                          ) : null}
                          <button
                            className="duration-300 hover:scale-105"
                            onClick={() =>
                              handleDeleteEnvironmentValueOfSecretClick(
                                value.environment.slug
                              )
                            }
                            type="button"
                          >
                            <TrashWhiteSVG />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-white/50">
              You have not added any values for any environment to this secret
              yet. Edit the secret to add values.
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
      <ContextMenuContent className="flex w-[15.938rem] flex-col items-center justify-center rounded-lg bg-[#3F3F46]">
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] border-b-[0.025rem] border-white/65 text-xs font-semibold tracking-wide"
          onSelect={handleRevisionsClick}
        >
          Show Version History
        </ContextMenuItem>
        <ContextMenuItem
          className="w-[15.938rem] border-b-[0.025rem] border-white/65 py-2 text-xs font-semibold tracking-wide"
          onSelect={handleCopyToClipboard}
        >
          Copy slug
        </ContextMenuItem>
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
          disabled={!isAuthorizedToEditSecrets}
          onSelect={handleEditClick}
        >
          Edit
        </ContextMenuItem>
        <ContextMenuItem
          className="h-[33%] w-[15.938rem] text-xs font-semibold tracking-wide"
          disabled={!isAuthorizedToDeleteSecrets}
          onSelect={handleDeleteClick}
        >
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
