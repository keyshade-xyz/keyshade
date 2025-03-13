import { useAtom, useAtomValue } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
import type {
  Environment,
  GetRevisionsOfSecretResponse
} from '@keyshade/schema'
import dayjs from 'dayjs'
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
  selectedProjectAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
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
  const [isSecretRevisionsOpen, setIsSecretRevisionsOpen] = useAtom(
    secretRevisionsOpenAtom
  )
  const selectedSecret = useAtomValue(selectedSecretAtom)
  const environments = useAtomValue(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const [isLoading, setIsLoading] = useState(true)
  const [revisions, setRevisions] = useState<
    Record<Environment['name'], GetRevisionsOfSecretResponse['items']>
  >({})

  const isDecrypted = useMemo(
    () => selectedProject?.storePrivateKey === true || false,
    [selectedProject]
  )

  const getAllRevisionsOfSecret = useHttp(
    (environmentSlug: Environment['slug']) =>
      ControllerInstance.getInstance().secretController.getRevisionsOfSecret({
        environmentSlug,
        secretSlug: selectedSecret!.secret.slug,
        decryptValue: isDecrypted
      })
  )

  useEffect(() => {
    if (selectedSecret && environments.length > 0) {
      Promise.all(
        environments.map((environment) =>
          getAllRevisionsOfSecret(environment.slug)
        )
      ).then((responses) => {
        const newRevisions = responses.reduce<
          Record<Environment['name'], GetRevisionsOfSecretResponse['items']>
        >((prevRevisions, { data, success }, index) => {
          if (success && data) {
            return {
              ...prevRevisions,
              [environments[index].name]: data.items
            }
          }
          return prevRevisions
        }, {})
        setRevisions(newRevisions)
        setIsLoading(false)
      })
    }
  }, [environments, getAllRevisionsOfSecret, selectedSecret])

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
              {Object.entries(revisions).map(([environmentName, versions]) => (
                <AccordionItem
                  className="rounded-xl bg-white/[3%] px-5 transition-all duration-150 ease-in hover:bg-white/[5%]"
                  key={environmentName}
                  value={environmentName}
                >
                  <AccordionTrigger className="hover:no-underline">
                    {environmentName}
                  </AccordionTrigger>
                  <AccordionContent>
                    {versions.length === 0 ? (
                      <div className="text-sm text-white/50">
                        No versions created yet
                      </div>
                    ) : (
                      versions.map((revision) => (
                        <div
                          className={`flex w-full flex-col gap-y-2 border-white/15 py-5 ${revision.version !== 1 ? 'border-b-[1px] border-white/15' : ''}`}
                          key={revision.version}
                        >
                          <div className="flex w-full flex-row justify-between">
                            <div className="font-semibold">
                              {isDecrypted ? revision.value : 'Hidden'}
                            </div>
                            <div className="rounded-lg bg-sky-500/30 px-2 text-sky-500">
                              v{revision.version}
                            </div>
                          </div>
                          <div className="flex gap-x-2 text-sm">
                            <span className="text-white/50">
                              {dayjs(revision.createdOn).toNow(true)} ago by
                            </span>
                            <span>{revision.createdBy.name} </span>
                          </div>
                        </div>
                      ))
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
