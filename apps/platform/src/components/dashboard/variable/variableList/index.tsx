'use client'
import React, { useCallback, useEffect, useState } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useSearchParams } from 'next/navigation'
import type { Variable } from '@keyshade/schema'
import { Accordion } from '@/components/ui/accordion'
import {
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  selectedProjectAtom,
  deleteEnvironmentValueOfVariableOpenAtom,
  variableRevisionsOpenAtom,
  rollbackVariableOpenAtom,
  globalSearchDataAtom,
  createVariableOpenAtom
} from '@/store'
import VariableCard from '@/components/dashboard/variable/variableCard'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import ControllerInstance from '@/lib/controller-instance'
import { cn } from '@/lib/utils'
import EmptyVariableListContent from '@/components/dashboard/variable/emptyVariableListSection'
import { useHighlight } from '@/hooks/use-highlight'
import ProjectErrorCard from '@/components/shared/project-error-card'

export default function VariableList(): React.JSX.Element {
  const searchParams = useSearchParams()
  const highlightSlug = searchParams.get('highlight')
  const isCreateVariableOpen = useAtomValue(createVariableOpenAtom)
  const isDeleteVariableOpen = useAtomValue(deleteVariableOpenAtom)
  const isEditVariableOpen = useAtomValue(editVariableOpenAtom)
  const isDeleteEnvironmentValueOfVariableOpen = useAtomValue(
    deleteEnvironmentValueOfVariableOpenAtom
  )
  const isVariableRevisionsOpen = useAtomValue(variableRevisionsOpenAtom)
  const isRollbackVariableOpen = useAtomValue(rollbackVariableOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setGlobalSearchData = useSetAtom(globalSearchDataAtom)
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0)

  const isAuthorizedToReadVariables =
    selectedProject?.entitlements.canReadVariables

  // Highlight the variable if a highlight slug is provided... eg,  baseURL/workspaceSlug/projectSlug?tab=variables&highlight=<variableSlug>
  const { isHighlighted } = useHighlight(highlightSlug, 'variable')

  useEffect(() => {
    const shouldRefetch =
      isCreateVariableOpen ||
      isDeleteVariableOpen ||
      isEditVariableOpen ||
      isDeleteEnvironmentValueOfVariableOpen ||
      isVariableRevisionsOpen ||
      isRollbackVariableOpen

    if (shouldRefetch) {
      setRefetchTrigger((prev) => prev + 1)
    }
  }, [
    isCreateVariableOpen,
    isDeleteVariableOpen,
    isEditVariableOpen,
    isDeleteEnvironmentValueOfVariableOpen,
    isVariableRevisionsOpen,
    isRollbackVariableOpen
  ])

  const fetchVariables = useCallback(
    async ({ page, limit }: { page: number; limit: number }) => {
      if (!selectedProject) {
        return {
          success: false,
          data: { items: [] },
          error: {
            message: JSON.stringify({
              header: 'Error',
              body: 'No project selected'
            })
          }
        }
      }
      try {
        const response =
          await ControllerInstance.getInstance().variableController.getAllVariablesOfProject(
            {
              projectSlug: selectedProject.slug,
              page,
              limit
            },
            {}
          )

        // Update global search data on successful fetch
        if (
          response.success &&
          response.data &&
          Array.isArray(response.data.items)
        ) {
          setGlobalSearchData((prev) => ({
            ...prev,
            variables: response.data!.items.map((item) => ({
              slug: item.slug,
              name: item.name,
              note: item.note
            }))
          }))
        }

        return {
          success: response.success,
          data: {
            items: response.data?.items || [],
            metadata: response.data?.metadata
          },
          error: response.error
            ? { message: response.error.message }
            : undefined
        }
      } catch (error) {
        return {
          success: false,
          data: { items: [] },
          error: {
            message: JSON.stringify({
              header: 'Error',
              body: 'Failed to fetch variables'
            })
          }
        }
      }
    },
    [selectedProject, setGlobalSearchData]
  )

  const renderVariableCard = useCallback(
    (variableData: Variable) => {
      return (
        <VariableCard
          className={cn(
            highlightSlug === variableData.slug &&
              isHighlighted &&
              'animate-highlight'
          )}
          variableData={variableData}
        />
      )
    },
    [highlightSlug, isHighlighted]
  )

  if (!isAuthorizedToReadVariables) {
    return <ProjectErrorCard tab="variables" />
  }

  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-start gap-y-8 p-3 text-white',
        isDeleteVariableOpen && 'inert'
      )}
    >
      <div className="flex h-fit w-full flex-col gap-4">
        <Accordion
          className="flex h-fit w-full flex-col gap-4"
          collapsible
          type="single"
        >
          <InfiniteScrollList
            className="flex h-fit w-full flex-col gap-4"
            emptyComponent={<EmptyVariableListContent />}
            fetchFunction={fetchVariables}
            itemComponent={renderVariableCard}
            itemKey={(variableData) => variableData.id}
            itemsPerPage={10}
            key={refetchTrigger}
          />
        </Accordion>
      </div>
    </div>
  )
}
