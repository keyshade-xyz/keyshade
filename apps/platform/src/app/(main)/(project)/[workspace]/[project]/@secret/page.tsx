'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { extend } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { SecretSVG } from '@public/svg/dashboard'
import { Accordion } from '@/components/ui/accordion'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import {
  createSecretOpenAtom,
  deleteSecretOpenAtom,
  editSecretOpenAtom,
  rollbackSecretOpenAtom,
  secretsOfProjectAtom,
  selectedProjectAtom,
  selectedSecretAtom
} from '@/store'
import ConfirmDeleteSecret from '@/components/dashboard/secret/confirmDeleteSecret'
import SecretCard from '@/components/dashboard/secret/secretCard'
import EditSecretSheet from '@/components/dashboard/secret/editSecretSheet'
import RollbackSecretSheet from '@/components/dashboard/secret/rollbackSecretSheet'
import { useHttp } from '@/hooks/use-http'

extend(relativeTime)

function SecretPage(): React.JSX.Element {
  const setIsCreateSecretOpen = useSetAtom(createSecretOpenAtom)
  const isEditSecretOpen = useAtomValue(editSecretOpenAtom)
  const isDeleteSecretOpen = useAtomValue(deleteSecretOpenAtom)
  const isRollbackSecretOpen = useAtomValue(rollbackSecretOpenAtom)
  const selectedSecret = useAtomValue(selectedSecretAtom)
  const [secrets, setSecrets] = useAtom(secretsOfProjectAtom)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const isDecrypted = useMemo(
    () => selectedProject?.storePrivateKey === true || false,
    [selectedProject]
  )

  const getAllSecretsOfProject = useHttp(() =>
    ControllerInstance.getInstance().secretController.getAllSecretsOfProject({
      projectSlug: selectedProject!.slug,
      decryptValue: isDecrypted
    })
  )

  useEffect(() => {
    selectedProject &&
      getAllSecretsOfProject()
        .then(({ success, data }) => {
          if (success && data) {
            setSecrets(data.items)
          }
        })
        .finally(() => { if (!isLoading) { setIsLoading(false) } })
  }, [getAllSecretsOfProject, isDecrypted, selectedProject, setSecrets, isLoading])

  return (
    <div
      className="flex h-full w-full"
      data-inert={isRollbackSecretOpen ? true : undefined}
    >
      {/* Showing this when there are no Secrets present */}
      {secrets.length === 0 ? (
        <div className="flex h-[95%] w-full flex-col items-center justify-center gap-y-8">
          <SecretSVG width="100" />

          <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4">
            <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
              Secrete your firstSecret
            </p>
            <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500]">
              Declare and store a Secret against different environments
            </p>
          </div>

          <Button
            className="h-[2.25rem] rounded-md bg-white text-black hover:bg-gray-300"
            onClick={() => setIsCreateSecretOpen(true)}
          >
            CreateSecret
          </Button>
        </div>
      ) : (
        // Showing this when Secrets are present
        <div
          className={`flex h-full w-full flex-col items-center justify-start gap-y-8 p-3 text-white ${isDeleteSecretOpen ? 'inert' : ''
            } `}
        >
          <Accordion className="flex h-fit w-full flex-col gap-4" collapsible type="single">
            {secrets.map((secretData) => (
              <SecretCard 
                isDecrypted={isDecrypted} 
                key={secretData.secret.id}
                secretData={secretData}
              />
            ))}
          </Accordion>
          {/* Delete Secret alert dialog */}
          {isDeleteSecretOpen && selectedSecret ? <ConfirmDeleteSecret /> : null}

          {/* Edit Secret sheet */}
          {isEditSecretOpen && selectedSecret ? <EditSecretSheet /> : null}

          {/* Rollback Secret sheet */}
          {isRollbackSecretOpen && selectedSecret ? <RollbackSecretSheet isDecrypted={isDecrypted} /> : null}
        </div>
      )}
    </div>
  )
}


export default SecretPage

