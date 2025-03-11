import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { AddSVG } from '@public/svg/shared'
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
import ControllerInstance from '@/lib/controller-instance'
import {
  createVariableOpenAtom,
  selectedProjectAtom,
  variablesOfProjectAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import { parseUpdatedEnvironmentValues } from '@/lib/utils'
import EnvironmentValueEditor from '@/components/common/environment-value-editor'

export default function AddVariableDialogue() {
  const [isCreateVariableOpen, setIsCreateVariableOpen] = useAtom(
    createVariableOpenAtom
  )
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setVariables = useSetAtom(variablesOfProjectAtom)

  const [requestData, setRequestData] = useState({
    name: '',
    note: ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [environmentValues, setEnvironmentValues] = useState<
    Record<string, string>
  >({})

  const createVariable = useHttp(() =>
    ControllerInstance.getInstance().variableController.createVariable({
      name: requestData.name,
      projectSlug: selectedProject!.slug,
      note: requestData.note,
      entries: parseUpdatedEnvironmentValues([], environmentValues)
    })
  )

  const handleClose = useCallback(() => {
    setIsCreateVariableOpen(false)
    setRequestData({
      name: '',
      note: ''
    })
    setEnvironmentValues({})
  }, [setIsCreateVariableOpen, setRequestData, setEnvironmentValues])

  const handleAddVariable = useCallback(async () => {
    if (selectedProject) {
      if (requestData.name.trim() === '') {
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

          handleClose()
        }
      } finally {
        toast.dismiss()
        setIsLoading(false)
      }
    }
  }, [
    selectedProject,
    requestData.name,
    createVariable,
    setVariables,
    handleClose
  ])

  return (
    <Dialog onOpenChange={handleClose} open={isCreateVariableOpen}>
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
                  setRequestData({
                    ...requestData,
                    name: e.target.value
                  })
                }
                placeholder="Enter the key of the variable"
                value={requestData.name}
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
                  setRequestData({
                    ...requestData,
                    note: e.target.value
                  })
                }
                placeholder="Enter the note of the variable"
                value={requestData.note}
              />
            </div>

            <EnvironmentValueEditor
              environmentValues={environmentValues}
              setEnvironmentValues={setEnvironmentValues}
            />

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
