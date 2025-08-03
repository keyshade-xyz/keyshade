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

export default function AddEnvironmentDialogue() {
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
        <Button
          className="bg-[#26282C] hover:bg-[#161819] hover:text-white/55"
          disabled={!isAuthorizedToCreateEnvironment}
          variant="outline"
        >
          <AddSVG /> Add Environment
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[25rem] w-[31.625rem] bg-[#18181B] text-white ">
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
            <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
              <label
                className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                htmlFor="environment-name"
              >
                Environment Name
              </label>
              <Input
                className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                id="environment-name"
                onChange={(e) =>
                  setNewEnvironmentData({
                    ...newEnvironmentData,
                    environmentName: e.target.value
                  })
                }
                placeholder="Enter the key of the environment"
                value={newEnvironmentData.environmentName}
              />
            </div>

            <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
              <label
                className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                htmlFor="environmente-note"
              >
                Environment Description
              </label>
              <Input
                className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
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
                className="h-[2.625rem] rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                disabled={isLoading}
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
