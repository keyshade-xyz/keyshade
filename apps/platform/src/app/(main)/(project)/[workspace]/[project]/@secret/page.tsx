'use client'
import React, { useEffect, useState } from 'react'
import { extend } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useSearchParams } from 'next/navigation'
import { Accordion } from '@/components/ui/accordion'
import ControllerInstance from '@/lib/controller-instance'
import SecretLoader from '@/components/dashboard/secret/secretLoader'
import { Button } from '@/components/ui/button'
import {
  deleteEnvironmentValueOfSecretOpenAtom,
  deleteSecretOpenAtom,
  editSecretOpenAtom,
  globalSearchDataAtom,
  rollbackSecretOpenAtom,
  secretRevisionsOpenAtom,
  shouldRevealSecretEnabled,
  secretsOfProjectAtom,
  selectedProjectAtom,
  selectedSecretAtom
} from '@/store'
import ConfirmDeleteSecret from '@/components/dashboard/secret/confirmDeleteSecret'
import SecretCard from '@/components/dashboard/secret/secretCard'
import EditSecretSheet from '@/components/dashboard/secret/editSecretSheet'
import { SECRET_PAGE_SIZE } from '@/lib/constants'
import EmptySecretListContent from '@/components/dashboard/secret/emptySecretListSection'
import ConfirmDeleteEnvironmentValueOfSecretDialog from '@/components/dashboard/secret/confirmDeleteEnvironmentValueOfSecret'
import SecretRevisionsSheet from '@/components/dashboard/secret/secretRevisionSheet'
import ConfirmRollbackSecret from '@/components/dashboard/secret/confirmRollbackSecret'
import { cn } from '@/lib/utils'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'

extend(relativeTime)

export default function SecretPage(): React.JSX.Element {
  const searchParams = useSearchParams()
  const highlightSlug = searchParams.get('highlight')

  const [page, setPage] = useState(0)
  const [hasMoreSecret, setHasMoreSecret] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isHighlighted, setIsHighlighted] = useState(false)

  const isEditSecretOpen = useAtomValue(editSecretOpenAtom)
  const isDeleteSecretOpen = useAtomValue(deleteSecretOpenAtom)
  const isDeleteEnvironmentValueOfSecretOpen = useAtomValue(
    deleteEnvironmentValueOfSecretOpenAtom
  )
  const isSecretRevisionsOpen = useAtomValue(secretRevisionsOpenAtom)
  const isRollbackSecretOpen = useAtomValue(rollbackSecretOpenAtom)
  const selectedSecret = useAtomValue(selectedSecretAtom)
  const [secrets, setSecrets] = useAtom(secretsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setGlobalSearchData = useSetAtom(globalSearchDataAtom)
  const isDecrypted = useAtomValue(shouldRevealSecretEnabled)
  const { projectPrivateKey } = useProjectPrivateKey()

  useEffect(() => {
    if (!selectedProject) return

    setIsLoading(true)

    ControllerInstance.getInstance()
      .secretController.getAllSecretsOfProject({
        projectSlug: selectedProject.slug,
        decryptValue: isDecrypted,
        page,
        limit: SECRET_PAGE_SIZE
      })
      .then(({ data, success }) => {
        if (!success || !data) return

        setSecrets((prev) =>
          page === 0 ? data.items : [...prev, ...data.items]
        )

        const nextLink = data.metadata.links.next
        setHasMoreSecret(nextLink !== null)

        setGlobalSearchData((prev) => ({
          ...prev,
          secrets:
            page === 0
              ? data.items.map((item) => ({
                  slug: item.secret.slug,
                  name: item.secret.name,
                  note: item.secret.note
                }))
              : [
                  ...prev.secrets,
                  ...data.items.map((item) => ({
                    slug: item.secret.slug,
                    name: item.secret.name,
                    note: item.secret.note
                  }))
                ]
        }))
      })
      .finally(() => setIsLoading(false))
  }, [selectedProject, page, isDecrypted, setGlobalSearchData, setSecrets])

  const handleLoadMore = () => {
    setPage((prev) => prev + 1)
  }

  useEffect(() => {
    if (!highlightSlug || secrets.length === 0) return

    const element = document.getElementById(`secret-${highlightSlug}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setIsHighlighted(true)
      setTimeout(() => setIsHighlighted(false), 2000)
    }
  }, [highlightSlug, secrets])

  if (isLoading && page === 0) {
    return (
      <div className="space-y-4">
        <SecretLoader />
        <SecretLoader />
        <SecretLoader />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full justify-center">
      {secrets.length === 0 ? (
        <EmptySecretListContent />
      ) : (
        <div
          className={cn(
            'flex h-full w-full flex-col items-center justify-start gap-y-8 p-3 text-white',
            isDeleteSecretOpen && 'inert'
          )}
        >
          <div className="flex h-fit w-full flex-col gap-4">
            <Accordion
              className="flex h-fit w-full flex-col gap-4"
              collapsible
              type="single"
            >
              {secrets.map((secretData) => (
                <SecretCard
                  className={cn(
                    highlightSlug === secretData.secret.slug &&
                      isHighlighted &&
                      'animate-highlight'
                  )}
                  isDecrypted={isDecrypted}
                  key={secretData.secret.id}
                  privateKey={projectPrivateKey}
                  secretData={secretData}
                />
              ))}
            </Accordion>

            {isLoading && page > 0 ? (
              <div className="w-full">
                <SecretLoader />
              </div>
            ) : null}
          </div>

          <Button
            className="h-[2.25rem] rounded-md bg-white text-black hover:bg-gray-300"
            disabled={isLoading || !hasMoreSecret}
            onClick={handleLoadMore}
          >
            Load more
          </Button>

          {isDeleteSecretOpen && selectedSecret ? (
            <ConfirmDeleteSecret />
          ) : null}
          {isEditSecretOpen && selectedSecret ? <EditSecretSheet /> : null}
          {isDeleteEnvironmentValueOfSecretOpen && selectedSecret ? (
            <ConfirmDeleteEnvironmentValueOfSecretDialog />
          ) : null}
          {isSecretRevisionsOpen && selectedSecret ? (
            <SecretRevisionsSheet />
          ) : null}
          {isRollbackSecretOpen && selectedSecret ? (
            <ConfirmRollbackSecret />
          ) : null}
        </div>
      )}
    </div>
  )
}
