'use client'
import React, { useEffect, useState } from 'react'
import { extend } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAtom, useAtomValue } from 'jotai'
import { Accordion } from '@/components/ui/accordion'
import ControllerInstance from '@/lib/controller-instance'
import SecretLoader from '@/components/dashboard/secret/secretLoader'
import { Button } from '@/components/ui/button'
import {
  deleteEnvironmentValueOfSecretOpenAtom,
  deleteSecretOpenAtom,
  editSecretOpenAtom,
  rollbackSecretOpenAtom,
  secretRevisionsOpenAtom,
  shouldRevealSecretEnabled,
  secretsOfProjectAtom,
  selectedProjectAtom,
  selectedSecretAtom,
  projectPrivateKey
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

extend(relativeTime)

function SecretPage(): React.JSX.Element {
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
  const isDecrypted = useAtomValue(shouldRevealSecretEnabled)

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [privateKey, setPrivateKey] = useAtom(projectPrivateKey)

  useEffect(() => {
    const key = selectedProject?.storePrivateKey
      ? selectedProject.privateKey
      : localStorage.getItem(`${selectedProject?.name}_pk`) || null
    setPrivateKey(key)
  }, [selectedProject, setPrivateKey])

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
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [getAllSecretsOfProject, isDecrypted, page, selectedProject, setSecrets])

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1)
  }

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
                  isDecrypted={isDecrypted}
                  key={secretData.secret.id}
                  privateKey={privateKey}
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
