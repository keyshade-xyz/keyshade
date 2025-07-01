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
  projectVariableCountAtom,
  selectedProjectAtom,
  variablesOfProjectAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import { cn, parseUpdatedEnvironmentValues, validateAlphanumericInput } from '@/lib/utils'
import EnvironmentValueEditor from '@/components/common/environment-value-editor'

export default function AddVariableDialogue() {
  const [isCreateVariableOpen, setIsCreateVariableOpen] = useAtom(
    createVariableOpenAtom
  )
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setVariables = useSetAtom(variablesOfProjectAtom)
  const setProjectVariableCount = useSetAtom(projectVariableCountAtom)

  const [requestData, setRequestData] = useState({
    name: '',
    note: ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [environmentValues, setEnvironmentValues] = useState<
    Record<string, string>
  >({})
  const [variableNameError, setVariableNameError] = useState<string>('')

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
          setProjectVariableCount((prev) => prev + 1)
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
    handleClose,
    setProjectVariableCount
  ])

  return (
    <Dialog
      onOpenChange={(open) => setIsCreateVariableOpen(open)}
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
      <DialogContent className="w-[31.625rem] bg-[#18181B] text-white ">
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
              <div className="flex w-full flex-col gap-2">
                <Input
                  className={cn('h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500', {
                    'border-red-500': Boolean(variableNameError)
                  })}
                  id="variable-name"
                  onChange={(e) => {
                    const value = e.target.value
                    setVariableNameError(
                      !validateAlphanumericInput(value)
                        ? 'Only English letters and digits are allowed.'
                        : ''
                    )
                    setRequestData({
                      ...requestData,
                      name: value
                    })
                  }}
                  placeholder="Enter the key of the variable"
                  value={requestData.name}
                />
                {variableNameError ? <span className="my-2 text-xs text-red-500">
                    {variableNameError}
                  </span> : null}
              </div>
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
                disabled={isLoading || Boolean(variableNameError)}
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
