'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue } from 'jotai'
import { History } from 'lucide-react'
import { extend, default as dayjs } from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
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

// Initialize dayjs plugins
extend(relativeTime)

const formatRelativeTime = (date: string): string => dayjs(date).fromNow()

interface CreatedBy {
  id: string
  name: string
  profilePictureUrl: string | null
}

interface Revision {
  id: string
  value: string
  version: number
  variableId: string
  createdOn: string
  createdById: string
  environmentId: string
  createdBy: CreatedBy // Make it required
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

interface RevisionResponse {
  id: string
  value: string
  version: number
  variableId: string
  createdOn: string
  createdById: string
  environmentId: string
  createdBy: CreatedBy | null // Make explicitly nullable
}

export default function RollbackVariableSheet() {
  const [isRollbackVariableOpen, setIsRollbackVariableOpen] = useAtom(
    rollbackVariableOpenAtom
  )
  const selectedVariableData = useAtomValue(selectedVariableAtom)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [environmentRevisions, setEnvironmentRevisions] = useState<EnvironmentRevisions[]>([])
  const [rollbackDetails, setRollbackDetails] = useState<RollbackDetails | null>(null)

  const getSheetTitle = () => {
    if (!selectedVariableData?.variable) {
      return 'Revisions'
    }
    return `${selectedVariableData.variable.name} Revisions`
  }

  const getCreatorName = (revision: Revision) => revision.createdBy.name

  useEffect(() => {
    if (!selectedVariableData?.variable) return
    if (!isRollbackVariableOpen) return
    
    setEnvironmentRevisions([])
    setIsLoading(true)

    Promise.all(
      selectedVariableData.values.map(async (value) => {
        try {
          const response = await ControllerInstance.getInstance()
            .variableController.getRevisionsOfVariable({
              variableSlug: selectedVariableData.variable.slug,
              environmentSlug: value.environment.slug
            })

          if (!response.success || !response.data?.items) {
            throw new Error(response.error?.message || 'Failed to fetch revision data')
          }

          const revisionsWithCreator = response.data.items
            .map((item: RevisionResponse) => {
              // Skip if required data is missing
              if (!item.id) return null

              // Create revision with guaranteed createdBy object
              return {
                ...item,
                createdBy: item.createdBy || {
                  id: item.createdById,
                  name: selectedVariableData.variable.lastUpdatedBy.name,
                  profilePictureUrl: null
                }
              } satisfies Revision
            })
            .filter(Boolean) // Simpler type guard since we're just removing nulls

          if (revisionsWithCreator.length === 0) {
            throw new Error('No revisions found for this environment')
          }

          return {
            environmentName: value.environment.name,
            environmentSlug: value.environment.slug,
            revisions: revisionsWithCreator
          }
        } catch (error) {
          toast.error('Failed to fetch revisions', {
            description: error instanceof Error ? error.message : 'Unknown error occurred'
          })
          return null
        }
      })
    ).then((results) => {
      const validResults = results.filter((r): r is EnvironmentRevisions => r !== null)
      setEnvironmentRevisions(validResults)
      setIsLoading(false)
    })
  }, [selectedVariableData, isRollbackVariableOpen])

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-white/60 text-center py-8">Loading revisions...</div>
    }

    if (!environmentRevisions.length) {
      return <div className="text-white/60 text-center py-8">No revisions found</div>
    }

    return (
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
                  <div className="relative group" key={revision.id}>
                    <div className="absolute left-0 top-0 h-full w-0.5 bg-white/20">
                      <div className="absolute -left-[2px] top-0 h-1 w-1 rounded-full bg-white/60" />
                    </div>
                    
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
                          {formatRelativeTime(revision.createdOn)} by{' '}
                          <span className="text-white/60">
                            {getCreatorName(revision)}
                          </span>
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
    )
  }

  const handleRollbackClick = useCallback((environmentSlug: string, version: number) => {
    setRollbackDetails({ environmentSlug, version })
  }, [])

  const handleConfirmRollback = useCallback(() => {
    if (!rollbackDetails) return

    setIsLoading(true)
    toast.loading('Rolling back variable...')

    try {
      toast.success('Variable rolled back successfully', {
        description: (
          <p className="text-xs text-emerald-300">
            The variable has been rolled back to version {rollbackDetails.version}
          </p>
        )
      })
      setRollbackDetails(null)
      setIsRollbackVariableOpen(false)
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
            setRollbackDetails(null)
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
              {getSheetTitle()}
            </SheetTitle>
            <SheetDescription className="text-white/60">
              <b>Version History</b>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-8 overflow-y-auto pr-2">
            {!selectedVariableData?.variable ? (
              <div className="text-white/60 text-center py-8">Loading variable data...</div>
            ) : (
              renderContent()
            )}
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
