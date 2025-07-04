import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import type { Environment, SecretVersion } from '@keyshade/schema'
import dayjs from 'dayjs'
import { RollbackSVG } from '@public/svg/shared'
import { decrypt } from '@keyshade/common'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  environmentsOfProjectAtom,
  selectedSecretAtom,
  secretRevisionsOpenAtom,
  selectedProjectAtom,
  rollbackSecretOpenAtom,
  selectedSecretEnvironmentAtom,
  selectedSecretRollbackVersionAtom,
  revisionsOfSecretAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent
} from '@/components/ui/accordion'

function Loader() {
  return (
    <div className="flex h-[4rem] animate-pulse items-center gap-x-3 rounded-xl bg-white/5 p-5">
      <div className="h-5 w-[80%] rounded-full bg-white/5" />
      <div className="h-5 w-[20%] rounded-full bg-white/5" />
    </div>
  )
}

export default function SecretRevisionsSheet(): React.JSX.Element {
  const [decryptedRevisions, setDecryptedRevisions] = useState<
    Record<number, string>
  >({})
  const [isSecretRevisionsOpen, setIsSecretRevisionsOpen] = useAtom(
    secretRevisionsOpenAtom
  )
  const selectedSecret = useAtomValue(selectedSecretAtom)
  const environments = useAtomValue(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setIsRollbackSecretOpen = useSetAtom(rollbackSecretOpenAtom)
  const setSelectedSecretEnvironment = useSetAtom(selectedSecretEnvironmentAtom)
  const setSelectedSecretRollbackVersion = useSetAtom(
    selectedSecretRollbackVersionAtom
  )
  const [revisions, setRevisions] = useAtom(revisionsOfSecretAtom)
  const { projectPrivateKey } = useProjectPrivateKey(selectedProject)

  const [isLoading, setIsLoading] = useState(true)

  const getAllRevisionsOfSecret = useHttp(
    (environmentSlug: Environment['slug']) =>
      ControllerInstance.getInstance().secretController.getRevisionsOfSecret({
        environmentSlug,
        secretSlug: selectedSecret!.secret.slug
      })
  )

  const handleRollbackClick = (
    environmentSlug: Environment['slug'],
    rollbackVersion: SecretVersion['version']
  ) => {
    setSelectedSecretEnvironment(environmentSlug)
    setSelectedSecretRollbackVersion(rollbackVersion)
    setIsRollbackSecretOpen(true)
  }

  useEffect(() => {
    if (selectedSecret && environments.length > 0) {
      Promise.all(
        environments.map((environment) =>
          getAllRevisionsOfSecret(environment.slug)
        )
      ).then((responses) => {
        const newRevisions = responses.reduce<
          {
            environment: {
              name: string
              slug: string
            }
            versions: SecretVersion[]
          }[]
        >((prevRevisions, { data, success }, index) => {
          if (success && data) {
            return [
              ...prevRevisions,
              {
                environment: environments[index],
                versions: data.items
              }
            ]
          }
          return prevRevisions
        }, [])
        setRevisions(newRevisions)
        setIsLoading(false)
      })
    }
  }, [environments, getAllRevisionsOfSecret, selectedSecret, setRevisions])

  useEffect(() => {
    if (!revisions.length) return

    revisions.forEach(({ versions }) => {
      versions.forEach((revision) => {
        if (decryptedRevisions[revision.version]) return

        if (projectPrivateKey) {
          decrypt(projectPrivateKey, revision.value)
            .then((decrypted) => {
              setDecryptedRevisions((prev) => ({
                ...prev,
                [revision.version]: decrypted
              }))
            })
            .catch((error) => {
              // eslint-disable-next-line no-console -- console.error is used for debugging
              console.error('Decryption failed:', error)
              setDecryptedRevisions((prev) => ({
                ...prev,
                [revision.version]: 'Hidden'
              }))
            })
        } else {
          setDecryptedRevisions((prev) => ({
            ...prev,
            [revision.version]: 'Hidden'
          }))
        }
      })
    })
  }, [projectPrivateKey, revisions, decryptedRevisions])

  return (
    <Sheet
      onOpenChange={(open) => setIsSecretRevisionsOpen(open)}
      open={isSecretRevisionsOpen}
    >
      <SheetContent className="border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">
            {selectedSecret?.secret.name}&apos;s revisions
          </SheetTitle>
          <SheetDescription className="text-white/60">
            See all the values of {selectedSecret?.secret.name} from the past.
            You can also roll back to a previous version from here.
          </SheetDescription>
        </SheetHeader>
        <div className="my-10 flex w-full flex-col">
          {isLoading ? (
            <div className="flex flex-col gap-y-5">
              <Loader />
              <Loader />
              <Loader />
            </div>
          ) : (
            <Accordion
              className="flex h-fit w-full flex-col gap-4"
              collapsible
              type="single"
            >
              {revisions.map(
                ({
                  environment: { name: environmentName, slug: environmentSlug },
                  versions
                }) => (
                  <AccordionItem
                    className="rounded-xl bg-white/[3%] px-5 transition-all duration-150 ease-in hover:bg-white/[5%]"
                    key={environmentName}
                    value={environmentName}
                  >
                    <AccordionTrigger
                      className="hover:no-underline"
                      rightChildren={<span>{environmentSlug}</span>}
                    >
                      {environmentName}
                    </AccordionTrigger>
                    <AccordionContent>
                      {versions.length === 0 ? (
                        <div className="text-sm text-white/50">
                          No versions created yet
                        </div>
                      ) : (
                        versions.map((revision, index) => (
                          <div
                            className={`group flex w-full flex-col gap-y-2 border-white/15 py-5 ${revision.version !== 1 ? 'border-b-[1px] border-white/15' : ''}`}
                            key={revision.version}
                          >
                            <div className="flex w-full flex-row justify-between">
                              <div className="font-semibold">
                                {decryptedRevisions[revision.version]}
                              </div>
                              <div className="rounded-lg bg-sky-500/30 px-2 text-sky-500">
                                v{revision.version}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-x-2 text-sm">
                              <div className="flex flex-row items-center gap-x-2">
                                <span className="text-white/50">
                                  {dayjs(revision.createdOn).toNow(true)} ago by
                                </span>
                                <span>{revision.createdBy.name} </span>
                              </div>
                              {index !== 0 ? (
                                <button
                                  className="opacity-0 transition-all duration-150 ease-in group-hover:opacity-100"
                                  onClick={() =>
                                    handleRollbackClick(
                                      environmentSlug,
                                      revision.version
                                    )
                                  }
                                  type="button"
                                >
                                  <RollbackSVG />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )
              )}
            </Accordion>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
