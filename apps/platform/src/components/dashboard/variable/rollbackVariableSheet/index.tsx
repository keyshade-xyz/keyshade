'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue } from 'jotai'
import { History } from 'lucide-react'
import * as dayjs from 'dayjs'
import ConfirmRollbackDialog from '../confirmRollbackDialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion'
import {
  rollbackVariableOpenAtom,
  selectedVariableAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'

/**
 * Formats a date into a standardized string representation.
 * 
 * @param date - The date to format
 * @returns The formatted date string in "D MMMM, YYYY h:mm A" format
 */
const formatDate = (date: Date | string): string => {
  return dayjs(date).format('D MMMM, YYYY h:mm A')
}

interface Revision {
  version: number
  value: string
  createdBy?: {  // Make createdBy optional
    id: string
    name: string
    profilePictureUrl: string | null
  } | null  // Allow null
  createdOn: string
  id: string
  environmentId: string
  createdById: string
  variableId: string
}

interface EnvironmentRevisions {
  environmentName: string
  environmentSlug: string
  revisions: Revision[]
}

interface RollbackDetails {
  environmentSlug: string
  version: number
}

export default function RollbackVariableSheet() {
  const [isRollbackVariableOpen, setIsRollbackVariableOpen] = useAtom(
    rollbackVariableOpenAtom
  )
  const selectedVariableData = useAtomValue(selectedVariableAtom)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [environmentRevisions, setEnvironmentRevisions] = useState<EnvironmentRevisions[]>([])
  const [rollbackDetails, setRollbackDetails] = useState<RollbackDetails | null>(null)

  useEffect(() => {
    if (selectedVariableData && isRollbackVariableOpen) {
      Promise.all(
        selectedVariableData.values.map(async (value) => {
          const { data, success } = await ControllerInstance.getInstance()
            .variableController.getRevisionsOfVariable({
              variableSlug: selectedVariableData.variable.slug,
              environmentSlug: value.environment.slug
            })
          if (success && data) {
            return {
              environmentName: value.environment.name,
              environmentSlug: value.environment.slug,
              revisions: data.items
            } as EnvironmentRevisions
          }
          return null
        })
      ).then((results) => {
        setEnvironmentRevisions(results.filter(Boolean) as EnvironmentRevisions[])
      })
    }
  }, [selectedVariableData, isRollbackVariableOpen])

  const handleRollbackClick = useCallback((environmentSlug: string, version: number) => {
    setRollbackDetails({ environmentSlug, version })
  }, [])

  const handleConfirmRollback = useCallback(() => {
    if (!rollbackDetails) return

    setIsLoading(true)
    toast.loading('Rolling back variable...')

    // TODO: Implement actual rollback API call
    try {
      toast.success('Variable rolled back successfully', {
        description: (
          <p className="text-xs text-emerald-300">
            The variable has been rolled back to version {rollbackDetails.version}
          </p>
        )
      })
      setRollbackDetails(null)
      setIsRollbackVariableOpen(false) // Close the sheet after rollback
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }, [rollbackDetails, setIsRollbackVariableOpen])

  return (
    <>
      <Sheet
        onOpenChange={(open) => {
          setIsRollbackVariableOpen(open)
          if (!open) {
            setRollbackDetails(null) // Clear rollback details when sheet closes
          }
        }}
        open={isRollbackVariableOpen}
      >
        <SheetContent 
          className="border-white/15 bg-[#222425] w-[1400px] max-w-[95vw]"
          onEscapeKeyDown={(e) => {
            e.preventDefault()
            setIsRollbackVariableOpen(false)
          }}
          onInteractOutside={(e) => {
            e.preventDefault()
          }}
        >
          <SheetHeader>
            <SheetTitle className="text-white">
              {selectedVariableData?.variable.name} Revisions
            </SheetTitle>
            <SheetDescription className="text-white/60">
              <b>Version History</b>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 overflow-y-auto pr-2">
            <Accordion className="w-full space-y-2" collapsible type="single">
              {environmentRevisions.map((env) => (
                <AccordionItem 
                  className="border border-white/10 rounded-xl px-6 bg-neutral-800/50"
                  key={env.environmentSlug}
                  value={env.environmentSlug}
                >
                  <AccordionTrigger className="hover:no-underline py-6">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-lg">{env.environmentName}</span>
                      <span className="text-xs text-white/60">
                        ({env.revisions.length} versions)
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6 py-4">
                      {env.revisions.map((revision) => (
                        <div className="relative group" key={revision.version}>
                          {/* Timeline dot and line */}
                          <div className="absolute left-0 top-0 h-full w-0.5 bg-white/20">
                            <div className="absolute -left-[2px] top-0 h-1 w-1 rounded-full bg-white/60" />
                          </div>
                          
                          {/* Version content with rollback icon */}
                          <div className="ml-6 flex flex-col group-hover:bg-white/5 rounded-lg transition-colors p-5 relative">
                            <button 
                              className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity"
                              disabled={isLoading}
                              onClick={() => handleRollbackClick(env.environmentSlug, revision.version)}
                              type="button"
                            >
                              <History className="w-5 h-5 text-white/60 hover:text-white" />
                            </button>

                            <div className="flex-grow space-y-3 pr-8">
                              <div className="flex items-center gap-3">
                                <div className="text-base text-white/80 flex-grow">
                                  {revision.value}
                                  <span className="px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 text-sm font-medium ml-3">
                                    v{revision.version}
                                  </span>
                                </div>
                              </div>
                              <div className="text-sm text-white/40">
                                {formatDate(revision.createdOn)} by {revision.createdBy?.name ?? 'Unknown'}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmRollbackDialog
        isLoading={isLoading}
        isOpen={rollbackDetails !== null}
        onClose={() => setRollbackDetails(null)}
        onConfirm={handleConfirmRollback}
        version={rollbackDetails?.version ?? 0}
      />
    </>
  )
}
