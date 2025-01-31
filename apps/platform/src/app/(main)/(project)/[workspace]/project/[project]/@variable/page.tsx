'use client'

import { useEffect } from 'react'
import type {
  ClientResponse,
  GetAllVariablesOfProjectResponse
} from '@keyshade/schema'
import { VariableSVG } from '@public/svg/dashboard'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
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
import EditVariableDialog from '@/components/dashboard/variable/editVariableDialogue'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { Accordion } from '@/components/ui/accordion'

function VariablePage(): React.JSX.Element {
  const setIsCreateVariableOpen = useSetAtom(createVariableOpenAtom)
  const isDeleteVariableOpen = useAtomValue(deleteVariableOpenAtom)
  const isEditVariableOpen = useAtomValue(editVariableOpenAtom)
  const selectedVariable = useAtomValue(selectedVariableAtom)
  const [variables, setVariables] = useAtom(variablesOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  useEffect(() => {
    const getAllVariables = async () => {
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

      const {
        success,
        error,
        data
      }: ClientResponse<GetAllVariablesOfProjectResponse> =
        await ControllerInstance.getInstance().variableController.getAllVariablesOfProject(
          { projectSlug: selectedProject.slug },
          {}
        )

      if (success && data) {
        setVariables(data.items)
      } else {
        toast.error('Something went wrong!', {
          description: (
            <p className="text-xs text-red-300">
              Something went wrong while fetching variables. Check console for
              more info.
            </p>
          )
        })
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    }

    getAllVariables()
  }, [selectedProject, setVariables])

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
          {/* Delete variable alert dialog */}
          {isDeleteVariableOpen && selectedVariable ? (
            <ConfirmDeleteVariable />
          ) : null}

          {/* Edit variable dialog */}
          {isEditVariableOpen && selectedVariable ? (
            <EditVariableDialog />
          ) : null}
        </div>
      )}
    </div>
  )
}

export default VariablePage
