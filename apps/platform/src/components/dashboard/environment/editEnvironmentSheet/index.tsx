'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import ControllerInstance from '@/lib/controller-instance'
import {
  editEnvironmentOpenAtom,
  selectedEnvironmentAtom,
  environmentsOfProjectAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'

export default function EditEnvironmentDialogue(): React.JSX.Element {
  const [isEditEnvironmentOpen, setIsEditEnvironmentOpen] = useAtom(
    editEnvironmentOpenAtom
  )
  const selectedEnvironment = useAtomValue(selectedEnvironmentAtom)
  const setEnvironments = useSetAtom(environmentsOfProjectAtom)

  const [requestData, setRequestData] = useState<{
    name: string | undefined
    description: string | undefined
  }>({
    name: selectedEnvironment?.name,
    description: selectedEnvironment?.description || ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const updateRequestData = useCallback(
    (name: string, value: string) => {
      setRequestData((prev) => ({
        ...prev,
        [name]: value
      }))
    },
    [setRequestData]
  )

  const updateEnvironment = useHttp(() =>
    ControllerInstance.getInstance().environmentController.updateEnvironment({
      slug: selectedEnvironment!.slug,
      description:
        requestData.description === '' ? undefined : requestData.description,
      name:
        requestData.name === selectedEnvironment!.name ||
        requestData.name === ''
          ? undefined
          : requestData.name
    })
  )

  const handleUpdateEnvironment = useCallback(async () => {
    if (selectedEnvironment) {
      setIsLoading(true)
      toast.loading('Updating environment...')

      try {
        const { success, data } = await updateEnvironment()

        if (success && data) {
          toast.success('Environment updated successfully', {
            description: (
              <p className="text-xs text-green-300">
                You successfully edited the environment
              </p>
            )
          })

          // Update the environment in the store
          setEnvironments((prev) => {
            return prev.map((environment) => {
              if (environment.slug === selectedEnvironment.slug) {
                return {
                  ...environment,
                  slug: data.slug,
                  name: data.name,
                  description: data.description
                }
              }
              return environment
            })
          })

          // Close the sheet
          setIsEditEnvironmentOpen(false)
        }
      } finally {
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    selectedEnvironment,
    updateEnvironment,
    setEnvironments,
    setIsEditEnvironmentOpen
  ])

  return (
    <Sheet
      onOpenChange={(open) => {
        setIsEditEnvironmentOpen(open)
      }}
      open={isEditEnvironmentOpen}
    >
      <SheetContent className="border-white/15 bg-[#222425] p-6 text-white sm:max-w-[506px]">
        <SheetHeader>
          <SheetTitle className="text-base font-bold text-white">
            Edit this environment
          </SheetTitle>
          <SheetDescription className="text-sm text-white/60">
            Edit the environment name or the description
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-start gap-4">
            <Label htmlFor="environment-name">Environment Name</Label>
            <Input
              className="bg-[#262626] text-base  text-white"
              id="environment-name"
              name="name"
              onChange={(e) => updateRequestData(e.target.name, e.target.value)}
              value={requestData.name}
            />
          </div>
          <div className="flex flex-col items-start gap-4">
            <Label htmlFor="environment-description">
              Environment Description
            </Label>
            <Textarea
              className="bg-[#262626] text-base text-white"
              id="environment-description"
              name="description"
              onChange={(e) => updateRequestData(e.target.name, e.target.value)}
              value={requestData.description}
            />
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <div className="flex justify-end">
                <Button
                  className="rounded-lg border-white/10 bg-[#E0E0E0] text-xs font-semibold text-black hover:bg-gray-200"
                  disabled={isLoading}
                  onClick={handleUpdateEnvironment}
                  variant="secondary"
                >
                  Save Changes
                </Button>
              </div>
            </SheetClose>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
