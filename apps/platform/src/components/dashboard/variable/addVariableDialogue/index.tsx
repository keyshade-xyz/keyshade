import type { CreateVariableRequest } from '@keyshade/schema'
import { AddSVG } from '@public/svg/shared'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import type { MouseEvent } from 'react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
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
import ControllerInstance from '@/lib/controller-instance'
import {
  createVariableOpenAtom,
  selectedProjectAtom,
  environmentsOfProjectAtom,
  variablesOfProjectAtom
} from '@/store'

export default function AddVariableDialogue() {
  const [isCreateVariableOpen, setIsCreateVariableOpen] = useAtom(
    createVariableOpenAtom
  )
  const environments = useAtomValue(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setVariables = useSetAtom(variablesOfProjectAtom)
  const [isloading, setIsLoading] = useState<boolean>(false)

  const [newVariableData, setNewVariableData] = useState({
    variableName: '',
    note: '',
    environmentSlug: environments[0]?.slug,
    environmentValue: ''
  })

  const handleAddVariable = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()

      toast.loading('Adding New Variable...')
      setIsLoading(true)

      if (!selectedProject) {
        toast.error('No project selected', {
          description: (
            <p className="text-xs text-red-300">
              No project selected. Please select a project.
            </p>
          )
        })
        throw new Error("Current project doesn't exist")
      }

      const request: CreateVariableRequest = {
        name: newVariableData.variableName,
        projectSlug: selectedProject.slug,
        entries: newVariableData.environmentValue
          ? [
              {
                value: newVariableData.environmentValue,
                environmentSlug: newVariableData.environmentSlug
              }
            ]
          : undefined,
        note: newVariableData.note
      }

      const { success, error, data } =
        await ControllerInstance.getInstance().variableController.createVariable(
          request,
          {}
        )
      toast.dismiss()
      if (success && data) {
        toast.success('Variable added successfully', {
          description: (
            <p className="text-xs text-emerald-300">
              The variable has been added to the project
            </p>
          )
        })

        // Add the variable to the store
        setVariables((prev) => [...prev, data])
      }

      if (error) {
        if (error.statusCode === 409) {
          toast.error('Variable already exists', {
            description: (
              <p className="text-xs text-red-300">
                Variable with the same name already exists. Please use different
                one.
              </p>
            )
          })
        } else {
          toast.error('Something went wrong!', {
            description: (
              <p className="text-xs text-red-300">
                Something went wrong adding the variable. Check console for more
                info.
              </p>
            )
          })
          // eslint-disable-next-line no-console -- we need to log the error that are not in the if condition
          console.error(error)
        }
      }
      setIsLoading(false)
      setIsCreateVariableOpen(false)
    },
    [selectedProject, newVariableData, setIsCreateVariableOpen, setVariables]
  )

  return (
    <Dialog
      onOpenChange={() => setIsCreateVariableOpen(!isCreateVariableOpen)}
      open={isCreateVariableOpen}
    >
      <DialogTrigger asChild>
        <Button
          className="bg-[#26282C] hover:bg-[#161819] hover:text-white/55"
          variant="outline"
        >
          <AddSVG /> Add Variable
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[25rem] w-[31.625rem] bg-[#18181B] text-white ">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Add a new variable
          </DialogTitle>
          <DialogDescription>
            Add a new variable to the project
          </DialogDescription>
        </DialogHeader>

        <div className=" text-white">
          <div className="space-y-4">
            <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
              <label
                className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                htmlFor="variable-name"
              >
                Variable Name
              </label>
              <Input
                className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                id="variable-name"
                onChange={(e) =>
                  setNewVariableData({
                    ...newVariableData,
                    variableName: e.target.value
                  })
                }
                placeholder="Enter the key of the variable"
                value={newVariableData.variableName}
              />
            </div>

            <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
              <label
                className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                htmlFor="variable-name"
              >
                Extra Note
              </label>
              <Input
                className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                id="variable-name"
                onChange={(e) =>
                  setNewVariableData({
                    ...newVariableData,
                    note: e.target.value
                  })
                }
                placeholder="Enter the note of the variable"
                value={newVariableData.note}
              />
            </div>

            <div className="grid h-[4.5rem] w-[28.125rem] grid-cols-2 gap-4">
              <div className="h-[4.5rem] w-[13.5rem] space-y-2">
                <label
                  className="h-[1.25rem] w-[9.75rem] text-base font-semibold"
                  htmlFor="envName"
                >
                  Environment Name
                </label>
                <Select
                  defaultValue={newVariableData.environmentSlug}
                  onValueChange={(val) =>
                    setNewVariableData({
                      ...newVariableData,
                      environmentSlug: val
                    })
                  }
                >
                  <SelectTrigger className="h-[2.75rem] w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent className=" w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300">
                    {environments.map((env) => (
                      <SelectItem key={env.id} value={env.slug}>
                        {env.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="h-[4.5rem] w-[13.375rem] space-y-2">
                <label
                  className="h-[1.25rem] w-[9.75rem] text-base font-semibold"
                  htmlFor="env-value"
                >
                  Environment Value
                </label>
                <Input
                  className="h-[2.75rem] w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                  id="env-value"
                  onChange={(e) =>
                    setNewVariableData({
                      ...newVariableData,
                      environmentValue: e.target.value
                    })
                  }
                  placeholder="Environment Value"
                  value={newVariableData.environmentValue}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                className="h-[2.625rem] w-[6.25rem] rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                onClick={handleAddVariable}
                disabled={isloading}
              >
                Add Variable
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
