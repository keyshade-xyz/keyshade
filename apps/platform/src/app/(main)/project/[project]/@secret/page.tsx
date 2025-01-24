'use client'
import React, { useEffect, useMemo, useState } from 'react'
import { extend } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { SecretLogoSVG } from '@public/svg/secret'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
import { Accordion } from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'
import ControllerInstance from '@/lib/controller-instance'
import SecretLoader from '@/components/dashboard/secret/secretLoader'
import { Button } from '@/components/ui/button'
import {
  createSecretOpenAtom,
  secretsOfProjectAtom,
  selectedProjectAtom
} from '@/store'
import SecretCard from '@/components/dashboard/secret/secretCard'

extend(relativeTime)

function SecretPage(): React.JSX.Element {
  const setIsCreateSecretOpen = useSetAtom(createSecretOpenAtom)
  const [secrets, setSecrets] = useAtom(secretsOfProjectAtom)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const isDecrypted = useMemo(
    () => selectedProject?.storePrivateKey === true || false,
    [selectedProject]
  )

  useEffect(() => {
    setIsLoading(true)

    async function getAllSecretsByProjectSlug() {
      if (!selectedProject) {
        toast.error('No project selected', {
          description: (
            <p className="text-xs text-red-300">
              No project selected. Please select a project.
            </p>
          )
        })
        return
      }

      const { success, error, data } =
        await ControllerInstance.getInstance().secretController.getAllSecretsOfProject(
          { projectSlug: selectedProject.slug, decryptValue: isDecrypted },
          {}
        )

      if (success && data) {
        setSecrets(data.items)
      } else {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    }

    getAllSecretsByProjectSlug()

    setIsLoading(false)
  }, [isDecrypted, selectedProject, setSecrets])

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SecretLoader />
        <SecretLoader />
        <SecretLoader />
      </div>
    )
  }

  return (
    <div className={` flex h-full w-full justify-center `}>
      {secrets.length === 0 ? (
        <div className="flex h-[23.75rem] w-[30.25rem] flex-col items-center justify-center gap-y-8">
          <SecretLogoSVG />

          <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4">
            <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
              Declare your first secret
            </p>
            <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500]">
              Declare and store a secret against different environments
            </p>
          </div>

          <Button
            className="h-[2.25rem] w-[8rem] rounded-md bg-white text-black hover:bg-gray-300"
            onClick={() => setIsCreateSecretOpen(true)}
          >
            Create secret
          </Button>
        </div>
      ) : (
        <ScrollArea className=" mb-4 h-[50rem] w-full">
          <Accordion
            className="flex h-[50rem] w-full flex-col gap-4"
            collapsible
            type="single"
          >
            {secrets.map((secret) => (
              <SecretCard
                isDecrypted={isDecrypted}
                key={secret.secret.id}
                secretData={secret}
              />
            ))}
          </Accordion>
        </ScrollArea>
      )}
    </div>
  )
}

export default SecretPage
