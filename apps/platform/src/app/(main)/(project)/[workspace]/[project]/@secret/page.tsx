'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { extend } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { SecretSVG } from '@public/svg/dashboard'
import { Accordion } from '@/components/ui/accordion'
import ControllerInstance from '@/lib/controller-instance'
import SecretLoader from '@/components/dashboard/secret/secretLoader'
import { Button } from '@/components/ui/button'
import {
  createSecretOpenAtom,
  deleteSecretOpenAtom,
  editSecretOpenAtom,
  secretsOfProjectAtom,
  selectedProjectAtom,
  selectedSecretAtom
} from '@/store'
import ConfirmDeleteSecret from '@/components/dashboard/secret/confirmDeleteSecret'
import SecretCard from '@/components/dashboard/secret/secretCard'
import EditSecretSheet from '@/components/dashboard/secret/editSecretSheet'
import { useHttp } from '@/hooks/use-http'
import { SECRET_PAGE_SIZE } from '@/lib/constants'

extend(relativeTime)

function SecretPage(): React.JSX.Element {
  const setIsCreateSecretOpen = useSetAtom(createSecretOpenAtom)
  const isEditSecretOpen = useAtomValue(editSecretOpenAtom)
  const isDeleteSecretOpen = useAtomValue(deleteSecretOpenAtom)
  const selectedSecret = useAtomValue(selectedSecretAtom)
  const [secrets, setSecrets] = useAtom(secretsOfProjectAtom)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const isDecrypted = useMemo(
    () => selectedProject?.storePrivateKey === true || false,
    [selectedProject]
  )

  const getAllSecretsOfProject = useHttp(() =>
    ControllerInstance.getInstance().secretController.getAllSecretsOfProject({
      projectSlug: selectedProject!.slug,
      decryptValue: isDecrypted,
      page,
      limit: SECRET_PAGE_SIZE
    })
  )

  useEffect(() => {
    const fetchSecrets = async () => {
      if (!selectedProject) {
        toast.error('No project selected', {
          description: <p className="text-xs text-red-300">
            Please select a project to view secrets.
          </p>
        })
        return
      }

      try {
        setIsLoading(true)
        const { data, success } = await getAllSecretsOfProject()
        if (success && data) {
          setSecrets((prev) => page === 0 ? data.items : [...prev, ...data.items])
          if (data.metadata.links.next === null) {
            setHasMore(false)
          }
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchSecrets()
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
        <div className="flex h-[95%] w-full flex-col items-center justify-center gap-y-8">
          <SecretSVG width={100} />

          <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4">
            <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
              Declare your first secret
            </p>
            <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500]">
              Declare and store a secret against different environments
            </p>
          </div>

          <Button
            className="h-[2.25rem] rounded-md bg-white text-black hover:bg-gray-300"
            onClick={() => setIsCreateSecretOpen(true)}
          >
            Create secret
          </Button>
        </div>
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
                  secretData={secretData}
                />
              ))}
            </Accordion>

            {isLoading && page > 0 ? <div className="w-full"><SecretLoader /></div> : null}
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
        </div>
      )}
    </div>
  )
}

export default SecretPage
