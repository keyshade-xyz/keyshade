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
import { useHttp } from '@/hooks/use-http'
import { SECRET_PAGE_SIZE } from '@/lib/constants'
import EmptySecretListContent from '@/components/dashboard/secret/emptySecretListSection'
import ConfirmDeleteEnvironmentValueOfSecretDialog from '@/components/dashboard/secret/confirmDeleteEnvironmentValueOfSecret'
import SecretRevisionsSheet from '@/components/dashboard/secret/secretRevisionSheet'
import ConfirmRollbackSecret from '@/components/dashboard/secret/confirmRollbackSecret'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import { cn } from '@/lib/utils'

extend(relativeTime)

function SecretPage(): React.JSX.Element {
  const searchParams = useSearchParams()
  const highlightSlug = searchParams.get('highlight')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
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

  const getAllSecretsOfProject = useHttp(() =>
    ControllerInstance.getInstance().secretController.getAllSecretsOfProject({
      projectSlug: selectedProject!.slug,
      decryptValue: isDecrypted,
      page,
      limit: SECRET_PAGE_SIZE
    })
  )

  useEffect(() => {
    if (selectedProject) {
      if (secrets.length > 0) {
        return;
      }

      setIsLoading(true)

      getAllSecretsOfProject()
        .then(({ data, success }) => {
          if (success && data) {
            setSecrets((prev) =>
              page === 0 ? data.items : [...prev, ...data.items]
            )
            if (data.metadata.links.next === null) {
              setHasMore(false)
            }
            setGlobalSearchData((prev) => ({
              ...prev,
              secrets: data.items.map((item) => ({
                slug: item.secret.slug,
                name: item.secret.name,
                note: item.secret.note,
              })),
            }))
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [getAllSecretsOfProject, page, secrets, selectedProject, setGlobalSearchData, setSecrets])

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1)
  }

  useEffect(() => {
    if (highlightSlug) {
      // Find and scroll to the element
      const element = document.getElementById(`secret-${highlightSlug}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setIsHighlighted(true)

        // Remove highlight after animation
        setTimeout(() => {
          setIsHighlighted(false)
        }, 2000)
      }
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
    <div className={`flex h-full w-full justify-center `}>
      {secrets.length === 0 ? (
        <EmptySecretListContent />
      ) : (
        <div
          className={`flex h-full w-full flex-col items-center justify-start gap-y-8 p-3 text-white ${isDeleteSecretOpen ? 'inert' : ''} `}
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
                    highlightSlug === secretData.secret.slug && isHighlighted && 'animate-highlight'
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
            disabled={isLoading || !hasMore}
            onClick={handleLoadMore}
          >
            Load more
          </Button>

          {/* Delete secret alert dialog */}
          {isDeleteSecretOpen && selectedSecret ? (
            <ConfirmDeleteSecret />
          ) : null}

          {/* Edit secret sheet */}
          {isEditSecretOpen && selectedSecret ? <EditSecretSheet /> : null}

          {/* Delete environment value of secret alert dialog */}
          {isDeleteEnvironmentValueOfSecretOpen && selectedSecret ? (
            <ConfirmDeleteEnvironmentValueOfSecretDialog />
          ) : null}

          {/* Secret revisions sheet */}
          {isSecretRevisionsOpen && selectedSecret ? (
            <SecretRevisionsSheet />
          ) : null}

          {/* Rollback secret alert dialog */}
          {isRollbackSecretOpen && selectedSecret ? (
            <ConfirmRollbackSecret />
          ) : null}
        </div>
      )}
    </div>
  )
}

export default SecretPage
