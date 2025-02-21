'use client'

import { useEffect } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { VariableSVG } from '@public/svg/dashboard'
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

function VariablePage(): React.JSX.Element {
  const setIsCreateVariableOpen = useSetAtom(createVariableOpenAtom)
  const isDeleteVariableOpen = useAtomValue(deleteVariableOpenAtom)
  const isEditVariableOpen = useAtomValue(editVariableOpenAtom)
  const selectedVariable = useAtomValue(selectedVariableAtom)
  const [variables, setVariables] = useAtom(variablesOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const getAllVariablesOfProject = useHttp(() =>
    ControllerInstance.getInstance().variableController.getAllVariablesOfProject(
      {
        projectSlug: selectedProject!.slug
      }
    )
  )

  useEffect(() => {
    selectedProject &&
      getAllVariablesOfProject().then(({ data, success }) => {
        if (success && data) {
          setVariables(data.items)
        }
      })
  }, [getAllVariablesOfProject, selectedProject, setVariables])

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

          {/* Edit variable sheet */}
          {isEditVariableOpen && selectedVariable ? <EditVariablSheet /> : null}
        </div>
      )}
    </div>
  )
}

export default VariablePage
