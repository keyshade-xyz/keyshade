'use client'

import { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { VariableSVG } from '@public/svg/dashboard'
import { toast } from 'sonner'
import {
  createVariableOpenAtom,
  selectedProjectAtom,
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  selectedVariableAtom,
  variablesOfProjectAtom
} from '@/store'
import VariableCard from '@/components/dashboard/variable/variableCard'
import ConfirmDeleteVariable from '@/components/dashboard/variable/confirmDeleteVariable'
import EditVariablSheet from '@/components/dashboard/variable/editVariableSheet'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'
import { useHttp } from '@/hooks/use-http'
import VariableLoader from '@/components/dashboard/variable/variableLoader'

const ITEMS_PER_PAGE = 10

function VariablePage(): React.JSX.Element {
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const setIsCreateVariableOpen = useSetAtom(createVariableOpenAtom)
  const isDeleteVariableOpen = useAtomValue(deleteVariableOpenAtom)
  const isEditVariableOpen = useAtomValue(editVariableOpenAtom)
  const selectedVariable = useAtomValue(selectedVariableAtom)
  const [variables, setVariables] = useAtom(variablesOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const getAllVariablesOfProject = useHttp(() =>
    ControllerInstance.getInstance().variableController.getAllVariablesOfProject({
        projectSlug: selectedProject!.slug,
        page,
        limit: ITEMS_PER_PAGE,
    }, {})
  )

  useEffect(() => {
    const fetchVariables = async () => {
      if (!selectedProject) {
        toast.error('No project selected', {
          description: <p className="text-xs text-red-300">
            Please select a project to view variables.
          </p>
        })
        return
      }

      try {
        setIsLoading(true)
        const { data, success } = await getAllVariablesOfProject()
        if (success && data) {
          setVariables((prev) => page === 0 ? data.items : [...prev, ...data.items])
          if (data.items.length < ITEMS_PER_PAGE) {
            setHasMore(false)
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console -- debug error handling
        console.error('Error fetching variables:', error)
        toast.error('Failed to fetch variables', {
          description: <p className="text-xs text-red-300">
            Something went wrong while fetching variables. Please try again.
          </p>
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchVariables()
  }, [getAllVariablesOfProject, page, selectedProject, setVariables])

  const handleLoadMore = () => {
    if(!isLoading && hasMore) {
      setPage((prevPage) => prevPage + 1)
    }
  }

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
        <div className="flex h-[95%] w-full flex-col items-center justify-center gap-y-8">
          <VariableSVG width="100" />

          <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4">
            <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
              Declare your first variable
            </p>
            <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500]">
              Declare and store a variable against different environments
            </p>
          </div>

          <Button
            className="h-[2.25rem] rounded-md bg-white text-black hover:bg-gray-300"
            onClick={() => setIsCreateVariableOpen(true)}
          >
            Create variable
          </Button>
        </div>
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
              {variables.map(({ variable, values }) => (
                <VariableCard
                  key={variable.id}
                  values={values}
                  variable={variable}
                />
              ))}
            </Accordion>
            {isLoading && page > 0 ? <div className="w-full"><VariableLoader /></div> : null}
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
        </div>
      )}
    </div>
  )
}

export default VariablePage
