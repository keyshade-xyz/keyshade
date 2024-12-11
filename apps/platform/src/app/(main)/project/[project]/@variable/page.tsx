'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  EnvironmentController,
  VariableController
} from '@keyshade/api-client'
import {
  ClientResponse,
  CreateVariableRequest,
  Environment,
  GetAllEnvironmentsOfProjectResponse,
  Project
} from '@keyshade/schema'

interface VariablePageProps {
  currentProject: Project | undefined
}

function VariablePage({
  currentProject
}: VariablePageProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [newVariableData, setNewVariableData] = useState({
    variableName: '',
    note: '',
    environmentName: '',
    environmentValue: ''
  })
  const [availableEnvironments, setAvailableEnvironments] = useState<
    Environment[]
  >([])

  const addVariable = async (e: any) => {
    e.preventDefault()

    console.log('Data available in the state is: ', newVariableData)

    const variableController = new VariableController(
      process.env.NEXT_PUBLIC_BACKEND_URL
    )

    const request: CreateVariableRequest = {
      name: newVariableData.variableName,
      projectSlug: currentProject?.slug as string,
      entries: newVariableData.environmentValue
        ? [
            {
              value: newVariableData.environmentValue,
              environmentSlug: newVariableData.environmentName
            }
          ]
        : undefined,
      note: newVariableData.note
    }

    const { success, error, data } = await variableController.createVariable(
      request,
      {}
    )
    console.log('Value of success: ', success)
    console.log('Value of error: ', error)
    console.log('Response after api is: ', data)

    setIsOpen(false)
  }

  useEffect(() => {
    const getAllEnvironments = async () => {
      const environmentController = new EnvironmentController(
        process.env.NEXT_PUBLIC_BACKEND_URL
      )

      const {
        success,
        error,
        data
      }: ClientResponse<GetAllEnvironmentsOfProjectResponse> =
        await environmentController.getAllEnvironmentsOfProject(
          { projectSlug: currentProject!.slug },
          {}
        )

      if (success && data) {
        setAvailableEnvironments(data.items)
      } else {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    }

    getAllEnvironments()
  }, [currentProject])

  useEffect(() => {
    console.log('Value inside the env state: ', availableEnvironments)
  }, [availableEnvironments])

  return (
    <div>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">Add Variable</Button>
        </DialogTrigger>
        <DialogContent className="h-[23.313rem] w-[31.625rem] border-gray-800 bg-[#1a1a1a] text-white ">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              <div className="flex h-[2.813rem] w-[28.313rem] flex-col justify-start gap-y-2 ">
                <p className="h-[1.25rem] w-[9.375rem] text-base">
                  Add a new variable
                </p>
                <p className="h-[1.063rem] w-[28.313rem] text-sm font-[400] text-white text-opacity-60">
                  Add a new variable to the project
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className=" text-white">
            <form className="space-y-4">
              <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
                <label
                  htmlFor="variable-name"
                  className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                >
                  Variable Name
                </label>
                <Input
                  id="variable-name"
                  placeholder="Enter the key of the variable"
                  value={newVariableData.variableName}
                  onChange={(e) =>
                    setNewVariableData({
                      ...newVariableData,
                      variableName: e.target.value
                    })
                  }
                  className="h-[2.75rem] w-[20rem] border-0 bg-[#2a2a2a] text-gray-300 placeholder:text-gray-500"
                />
              </div>

              <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
                <label
                  htmlFor="variable-name"
                  className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                >
                  Extra Note
                </label>
                <Input
                  id="variable-name"
                  placeholder="Enter the note of the secret"
                  value={newVariableData.note}
                  onChange={(e) =>
                    setNewVariableData({
                      ...newVariableData,
                      note: e.target.value
                    })
                  }
                  className="h-[2.75rem] w-[20rem] border-0 bg-[#2a2a2a] text-gray-300 placeholder:text-gray-500"
                />
              </div>

              <div className="grid h-[4.5rem] w-[28.125rem] grid-cols-2 gap-4">
                <div className="h-[4.5rem] w-[13.5rem] space-y-2">
                  <label className="h-[1.25rem] w-[9.75rem] text-base font-semibold">
                    Environment Name
                  </label>
                  <Select
                    defaultValue="development"
                    onValueChange={(value) =>
                      setNewVariableData({
                        ...newVariableData,
                        environmentName: value
                      })
                    }
                  >
                    <SelectTrigger className="h-[2.75rem] w-[13.5rem] border-0 bg-[#2a2a2a] text-gray-300">
                      <SelectValue placeholder="Select environment" />
                    </SelectTrigger>
                    <SelectContent className=" w-[13.5rem] border-0 bg-[#2a2a2a] text-gray-300">
                      {availableEnvironments.map((env) => (
                        <SelectItem key={env.id} value={env.slug}>
                          {env.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="h-[4.5rem] w-[13.375rem] space-y-2">
                  <label
                    htmlFor="env-value"
                    className="h-[1.25rem] w-[9.75rem] text-base font-semibold"
                  >
                    Environment Value
                  </label>
                  <Input
                    id="env-value"
                    placeholder="Environment Value"
                    value={newVariableData.environmentValue}
                    onChange={(e) =>
                      setNewVariableData({
                        ...newVariableData,
                        environmentValue: e.target.value
                      })
                    }
                    className="h-[2.75rem] w-[13.5rem] border-0 bg-[#2a2a2a] text-gray-300 placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="h-[2.625rem] w-[6.25rem] rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                  onClick={addVariable}
                >
                  Add Variable
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default VariablePage
