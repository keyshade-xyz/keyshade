'use client'

import { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useSearchParams } from 'next/navigation'
import {
  selectedProjectAtom,
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  selectedVariableAtom,
  variablesOfProjectAtom,
  deleteEnvironmentValueOfVariableOpenAtom,
  variableRevisionsOpenAtom,
  rollbackVariableOpenAtom,
  globalSearchDataAtom
} from '@/store'
import VariableCard from '@/components/dashboard/variable/variableCard'
import ConfirmDeleteVariable from '@/components/dashboard/variable/confirmDeleteVariable'
import EditVariablSheet from '@/components/dashboard/variable/editVariableSheet'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'
import { useHttp } from '@/hooks/use-http'
import VariableLoader from '@/components/dashboard/variable/variableLoader'
import { VARIABLES_PAGE_SIZE } from '@/lib/constants'
import ConfirmDeleteEnvironmentValueOfVariableDialog from '@/components/dashboard/variable/confirmDeleteEnvironmentValueOfVariableDialog'
import EmptyVariableListContent from '@/components/dashboard/variable/emptyVariableListSection'
import VariableRevisionsSheet from '@/components/dashboard/variable/variableRevisionsSheet'
import ConfirmRollbackVariable from '@/components/dashboard/variable/confirmRollbackVariable'
import { cn } from '@/lib/utils'

function VariablePage(): React.JSX.Element {
  const searchParams = useSearchParams()
  const highlightSlug = searchParams.get('highlight')
  const [isHighlighted, setIsHighlighted] = useState(false)

  const isDeleteVariableOpen = useAtomValue(deleteVariableOpenAtom)
  const isEditVariableOpen = useAtomValue(editVariableOpenAtom)
  const isDeleteEnvironmentValueOfVariableOpen = useAtomValue(
    deleteEnvironmentValueOfVariableOpenAtom
  )
  const isVariableRevisionsOpen = useAtomValue(variableRevisionsOpenAtom)
  const isRollbackVariableOpen = useAtomValue(rollbackVariableOpenAtom)
  const selectedVariable = useAtomValue(selectedVariableAtom)
  const [variables, setVariables] = useAtom(variablesOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setGlobalSearchData = useSetAtom(globalSearchDataAtom)

  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const getAllVariablesOfProject = useHttp(() =>
    ControllerInstance.getInstance().variableController.getAllVariablesOfProject(
      {
        projectSlug: selectedProject!.slug,
        page,
        limit: VARIABLES_PAGE_SIZE
      },
      {}
    )
  )

  useEffect(() => {
    if (selectedProject) {
      setIsLoading(true)

      getAllVariablesOfProject()
        .then(({ data, success }) => {
          if (success && data) {
            setVariables((prev) =>
              page === 0 ? data.items : [...prev, ...data.items]
            )
            if (data.metadata.links.next === null) {
              setHasMore(false)
            }
            setGlobalSearchData((prev) => ({
              ...prev,
              variables: data.items.map((item) => ({
                slug: item.variable.slug,
                name: item.variable.name,
                note: item.variable.note,
              }))
            }))
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [getAllVariablesOfProject, page, selectedProject, setGlobalSearchData, setVariables])

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1)
  }

  useEffect(() => {
    if (highlightSlug) {
      // Find and scroll to the element
      const element = document.getElementById(`variable-${highlightSlug}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setIsHighlighted(true)

        // Remove highlight after animation
        setTimeout(() => {
          setIsHighlighted(false)
        }, 2000)
      }
    }
  }, [highlightSlug, variables])

  if (isLoading && page === 0) {
    return (
      <div className="space-y-4">
        <VariableLoader />
        <VariableLoader />
        <VariableLoader />
      </div>
    )
  }

  return (
    <div
      className={` flex h-full w-full ${isDeleteVariableOpen ? 'inert' : ''} `}
    >
      {/* Showing this when there are no variables present */}
      {variables.length === 0 ? (
        <EmptyVariableListContent />
      ) : (
        // Showing this when variables are present
        <div
          className={`flex h-full w-full flex-col items-center justify-start gap-y-8 p-3 text-white ${isDeleteVariableOpen ? 'inert' : ''} `}
        >
          <div className="flex h-fit w-full flex-col gap-4">
            <Accordion
              className="flex h-fit w-full flex-col gap-4"
              collapsible
              type="single"
            >
              {variables.map((variableData) => (
                <VariableCard
                  className={cn(
                    highlightSlug === variableData.variable.slug && isHighlighted && 'animate-highlight'
                  )}
                  key={variableData.variable.id}
                  variableData={variableData}
                />
              ))}
            </Accordion>
            {isLoading && page > 0 ? (
              <div className="w-full">
                <VariableLoader />
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
          {/* Delete variable alert dialog */}
          {isDeleteVariableOpen && selectedVariable ? (
            <ConfirmDeleteVariable />
          ) : null}

          {/* Edit variable sheet */}
          {isEditVariableOpen && selectedVariable ? <EditVariablSheet /> : null}

          {/* Delete environment value of variable alert dialog */}
          {isDeleteEnvironmentValueOfVariableOpen && selectedVariable ? (
            <ConfirmDeleteEnvironmentValueOfVariableDialog />
          ) : null}

          {/* Variable revisions sheet */}
          {isVariableRevisionsOpen && selectedVariable ? (
            <VariableRevisionsSheet />
          ) : null}

          {/* Rollback variable alert dialog */}
          {isRollbackVariableOpen && selectedVariable ? (
            <ConfirmRollbackVariable />
          ) : null}
        </div>
      )}
    </div>
  )
}

export default VariablePage
