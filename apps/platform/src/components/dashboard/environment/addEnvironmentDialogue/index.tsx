import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { AddSVG } from '@public/svg/shared'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader
} from '../../../ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  createEnvironmentOpenAtom,
  environmentsOfProjectAtom,
  projectEnvironmentCountAtom,
  selectedProjectAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { validateAlphanumericInput } from '@/lib/utils'

export default function AddEnvironmentDialogue(): React.JSX.Element {
  const [isCreateEnvironmentOpen, setIsCreateEnvironmentOpen] = useAtom(
    createEnvironmentOpenAtom
  )
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setEnvironments = useSetAtom(environmentsOfProjectAtom)
  const setProjectEnvironmentCount = useSetAtom(projectEnvironmentCountAtom)

  const isAuthorizedToCreateEnvironment =
    selectedProject?.entitlements.canCreateEnvironments

  const [newEnvironmentData, setNewEnvironmentData] = useState({
    environmentName: '',
    environmentDescription: ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [environmentNameError, setEnvironmentNameError] = useState<string>('')

  // Check if environment name is empty/only whitespace and whether is at least 3 chars length
  const MIN_ENV_NAME_LENGTH = 3
  const isInvalidEnvironmentName =
    newEnvironmentData.environmentName.trim() === '' ||
    newEnvironmentData.environmentName.trim().length < MIN_ENV_NAME_LENGTH

  const createEnvironment = useHttp(() =>
    ControllerInstance.getInstance().environmentController.createEnvironment({
      name: newEnvironmentData.environmentName,
      description: newEnvironmentData.environmentDescription,
      projectSlug: selectedProject!.slug
    })
  )

  const handleAddEnvironment = useCallback(async () => {
    if (selectedProject) {
      if (isInvalidEnvironmentName) {
        toast.error('Environment name is required', {
          description: (
            <p className="text-xs text-red-300">
              Please provide a valid name for the environment (not blank and at
              least has 3 chars).
            </p>
          )
        })
        return
      }

      setIsLoading(true)
      toast.loading('Adding environment...')

      try {
        const { success, data } = await createEnvironment()

        if (success && data) {
          setProjectEnvironmentCount((prev) => prev + 1)
          toast.success('Environment added successfully', {
            description: (
              <p className="text-xs text-green-300">
                You created a new environment
              </p>
            )
          })

          // Add the new environment to the list
          setEnvironments((prev) => [
            ...prev,
            { ...data, secrets: 0, variables: 0 }
          ])

          // Reset the form
          setNewEnvironmentData({
            environmentName: '',
            environmentDescription: ''
          })

          // Close the dialog
          setIsCreateEnvironmentOpen(false)
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    createEnvironment,
    selectedProject,
    setEnvironments,
    setProjectEnvironmentCount,
    setIsCreateEnvironmentOpen,
    isInvalidEnvironmentName
  ])

  return (
    <Dialog
      onOpenChange={() => setIsCreateEnvironmentOpen(!isCreateEnvironmentOpen)}
      open={isCreateEnvironmentOpen}
    >
      <DialogTrigger asChild>
        <Button disabled={!isAuthorizedToCreateEnvironment} variant="primary">
          <AddSVG /> Create Environments
        </Button>
      </DialogTrigger>
      <DialogContent className="h-100 w-126.5 bg-[#18181B] text-white ">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Add a new environment
          </DialogTitle>
          <DialogDescription>
            Add a new environment to the project. You can later on add more
            environments and variables to this environment.
          </DialogDescription>
        </DialogHeader>

        <div className=" text-white">
          <div className="space-y-4">
            <div className="w-114.5 flex h-11 items-center justify-center gap-6">
              <label
                className="w-28.5 h-5 text-base font-semibold"
                htmlFor="environment-name"
              >
                Environment Name
              </label>
              <div className='flex flex-col gap-2 w-full'>
              <Input
                className="w-[20rem]"
                id="environment-name"
                onChange={(e) => {
                  const value = e.target.value
                  setEnvironmentNameError(!validateAlphanumericInput(value) ? 'Only English letters and digits are allowed.' : '')
                  setNewEnvironmentData({
                    ...newEnvironmentData,
                    environmentName: e.target.value
                  })
                }}
                placeholder="Enter the key of the environment"
                value={newEnvironmentData.environmentName}
              />
              {environmentNameError ? <span className="text-xs text-red-500 my-2">{environmentNameError}</span> : null}
              </div>
            </div>

            <div className="w-114.5 flex h-11 items-center justify-center gap-6">
              <label
                className="w-28.5 h-5 text-base font-semibold"
                htmlFor="environmente-note"
              >
                Environment Description
              </label>
              <Input
                className="w-[20rem]"
                id="environment-note"
                onChange={(e) =>
                  setNewEnvironmentData({
                    ...newEnvironmentData,
                    environmentDescription: e.target.value
                  })
                }
                placeholder="Enter an optional description of the environment"
                value={newEnvironmentData.environmentDescription}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                className="h-10.5 rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                disabled={isLoading || Boolean(environmentNameError)}
                onClick={handleAddEnvironment}
              >
                Add Environment
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
