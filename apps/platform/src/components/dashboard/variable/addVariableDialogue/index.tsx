import { AddSVG } from '@public/svg/shared'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
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
import { useHttp } from '@/hooks/use-http'

export default function AddVariableDialogue() {
  const [isCreateVariableOpen, setIsCreateVariableOpen] = useAtom(
    createVariableOpenAtom
  )
  const environments = useAtomValue(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setVariables = useSetAtom(variablesOfProjectAtom)

  const [newVariableData, setNewVariableData] = useState({
    variableName: '',
    note: '',
    environmentSlug: environments[0]?.slug,
    environmentValue: ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const createVariable = useHttp(() =>
    ControllerInstance.getInstance().variableController.createVariable({
      name: newVariableData.variableName,
      projectSlug: selectedProject!.slug,
      entries: newVariableData.environmentValue
        ? [
            {
              value: newVariableData.environmentValue,
              environmentSlug: newVariableData.environmentSlug
            }
          ]
        : undefined,
      note: newVariableData.note
    })
  )

  const handleAddVariable = useCallback(async () => {
    if (selectedProject) {
      if (newVariableData.variableName.trim() === '') {
        toast.error('Variable name is required')
        return
      }

      setIsLoading(true)
      toast.loading('Creating variable...')

      try {
        const { success, data } = await createVariable()

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
          setIsCreateVariableOpen(false)
          setNewVariableData({
            variableName: '',
            note: '',
            environmentSlug: environments[0]?.slug,
            environmentValue: ''
          })
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    selectedProject,
    newVariableData.variableName,
    createVariable,
    setVariables,
    setIsCreateVariableOpen,
    environments
  ])

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
                disabled={isLoading}
                onClick={handleAddVariable}
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
