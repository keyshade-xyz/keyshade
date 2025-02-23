'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import type { GetAllVariablesOfProjectResponse } from '@keyshade/schema'
import { VariableSVG } from '@public/svg/dashboard'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  createVariableOpenAtom,
  selectedProjectAtom,
  deleteVariableOpenAtom,
  editVariableOpenAtom,
  selectedVariableAtom,
  variablesOfProjectAtom,
  rollbackVariableOpenAtom
} from '@/store'
import VariableCard from '@/components/dashboard/variable/variableCard'
import ConfirmDeleteVariable from '@/components/dashboard/variable/confirmDeleteVariable'
import EditVariablSheet from '@/components/dashboard/variable/editVariableSheet'
import RollbackVariableSheet from '@/components/dashboard/variable/rollbackVariableSheet'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'
import { useHttp } from '@/hooks/use-http'

interface ErrorResponse {
  message: string;
  error: string;
  statusCode: number;
}

interface ClientResponse<T> {
  data: T;
  success: boolean;
  error: ErrorResponse | null;
}

function VariablePage(): React.JSX.Element {
  const setIsCreateVariableOpen = useSetAtom(createVariableOpenAtom)
  const isDeleteVariableOpen = useAtomValue(deleteVariableOpenAtom)
  const isEditVariableOpen = useAtomValue(editVariableOpenAtom)
  const isRollbackVariableOpen = useAtomValue(rollbackVariableOpenAtom)
  const selectedVariable = useAtomValue(selectedVariableAtom)
  const [variables, setVariables] = useAtom(variablesOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const getAllVariablesOfProject = useHttp<
    GetAllVariablesOfProjectResponse,
    ClientResponse<GetAllVariablesOfProjectResponse>
  >(async () => {
    if (!selectedProject?.slug) {
      throw new Error('Project slug is required')
    }

    const response = await ControllerInstance.getInstance()
      .variableController.getAllVariablesOfProject({
        projectSlug: selectedProject.slug
      })
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to fetch variables')
    }
    
    return {
      data: response.data,
      success: true,
      error: null
    } as ClientResponse<GetAllVariablesOfProjectResponse>
  })

  useEffect(() => {
    if (selectedProject) {
      getAllVariablesOfProject()
        .then(({ data }) => {
          setVariables(data.items)
        })
        .catch((error: Error) => {
          toast.error('Failed to fetch variables', {
            description: error.message
          })
        })
    }
  }, [getAllVariablesOfProject, selectedProject, setVariables])

  return (
    <div 
      className="flex h-full w-full" 
      data-inert={isRollbackVariableOpen ? true : undefined}
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
          className={`flex h-full w-full flex-col items-center justify-start gap-y-8 p-3 text-white ${
            isDeleteVariableOpen ? 'inert' : ''
          } `}
        >
          <Accordion className="flex h-fit w-full flex-col gap-4" collapsible type="single">
            {variables.map(({ variable, values }) => (
              <VariableCard key={variable.id} values={values} variable={variable} />
            ))}
          </Accordion>
          {/* Delete variable alert dialog */}
          {isDeleteVariableOpen && selectedVariable ? <ConfirmDeleteVariable /> : null}

          {/* Edit variable sheet */}
          {isEditVariableOpen && selectedVariable ? <EditVariablSheet /> : null}

          {/* Rollback variable sheet */}
          {isRollbackVariableOpen && selectedVariable ? <RollbackVariableSheet /> : null}
        </div>
      )}
    </div>
  )
}

export default VariablePage
