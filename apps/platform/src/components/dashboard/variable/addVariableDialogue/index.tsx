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
import { parseUpdatedEnvironmentValues } from '@/lib/utils'
import EnvironmentValueEditor from '@/components/common/environment-value-editor'

export default function AddVariableDialogue(): React.JSX.Element {
  const [isCreateVariableOpen, setIsCreateVariableOpen] = useAtom(
    createVariableOpenAtom
  )
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setVariables = useSetAtom(variablesOfProjectAtom)
  const setProjectVariableCount = useSetAtom(projectVariableCountAtom)

  const isAuthorizedToCreateVariable =
    selectedProject?.entitlements.canCreateVariables

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
    setIsCreateVariableOpen((prev) => !prev)
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
        <Button disabled={!isAuthorizedToCreateVariable} variant="primary">
          <AddSVG /> Create Variables
        </Button>
      </DialogTrigger>
      <DialogContent className="w-126.5 bg-[#18181B] text-white ">
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
            <div className="w-114.5 flex h-11 items-center justify-center gap-6">
              <label
                className="w-28.5 h-5 text-base font-semibold"
                htmlFor="variable-name"
              >
                Variable Name
              </label>
              <Input
                className="w-[20rem]"
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

            <div className="w-114.5 flex h-11 items-center justify-center gap-6">
              <label
                className="w-28.5 h-5 text-base font-semibold"
                htmlFor="variable-name"
              >
                Extra Note
              </label>
              <Input
                className="w-[20rem]"
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
                className="h-10.5 w-25 rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
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
