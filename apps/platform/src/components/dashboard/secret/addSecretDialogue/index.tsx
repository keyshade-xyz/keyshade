import React, { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { AddSVG } from '@public/svg/shared'
import { Input } from '../../../ui/input'
import { Button } from '../../../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../../ui/dialog'
import ControllerInstance from '@/lib/controller-instance'
import {
  createSecretOpenAtom,
  selectedProjectAtom,
  secretsOfProjectAtom,
  projectSecretCountAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import { parseUpdatedEnvironmentValues } from '@/lib/utils'
import EnvironmentValueEditor from '@/components/common/environment-value-editor'

export default function AddSecretDialog() {
  const [isCreateSecretOpen, setIsCreateSecretOpen] =
    useAtom(createSecretOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setProjectSecretCount = useSetAtom(projectSecretCountAtom)
  const setSecrets = useSetAtom(secretsOfProjectAtom)

  const [requestData, setRequestData] = useState({
    name: '',
    note: ''
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [environmentValues, setEnvironmentValues] = useState<
    Record<string, string>
  >({})

  const createSecret = useHttp(() =>
    ControllerInstance.getInstance().secretController.createSecret({
      name: requestData.name,
      projectSlug: selectedProject!.slug,
      note: requestData.note,
      entries: parseUpdatedEnvironmentValues([], environmentValues)
    })
  )

  const handleClose = useCallback(() => {
    setIsCreateSecretOpen((prev) => !prev)
    setRequestData({
      name: '',
      note: ''
    })
    setEnvironmentValues({})
  }, [setIsCreateSecretOpen, setRequestData, setEnvironmentValues])

  const handleAddSecret = useCallback(async () => {
    if (selectedProject) {
      if (requestData.name.trim() === '') {
        toast.error('Please enter a secret name')
        return
      }

      setIsLoading(true)
      toast.loading('Creating secret...')

      try {
        const { success, data } = await createSecret()

        if (success && data) {
          setProjectSecretCount((prev) => prev + 1)
          toast.success('Secret added successfully', {
            description: (
              <p className="text-xs text-emerald-300">
                You created a new secret
              </p>
            )
          })

          // Add the new secret to the list of secrets
          setSecrets((prev) => [...prev, data])

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
    createSecret,
    setSecrets,
    handleClose,
    setProjectSecretCount
  ])

  return (
    <div className="flex items-center justify-center gap-6">
      <Dialog onOpenChange={handleClose} open={isCreateSecretOpen}>
        <DialogTrigger asChild>
          <Button
            className="bg-[#26282C] hover:bg-[#161819] hover:text-white/55"
            variant="outline"
          >
            <AddSVG /> Add Secret
          </Button>
        </DialogTrigger>
        <DialogContent className="w-[31.625rem] bg-[#18181B] text-white ">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              Add a new secret
            </DialogTitle>
            <DialogDescription>
              Add a new secret to the project. This secret will be encrypted and
              stored securely.
            </DialogDescription>
          </DialogHeader>

          <div className=" text-white">
            <div className="space-y-4">
              <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
                <label
                  className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                  htmlFor="secret-name"
                >
                  Secret Name
                </label>
                <Input
                  className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                  disabled={isLoading}
                  id="secret-name"
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      name: e.target.value
                    })
                  }
                  placeholder="Enter the key of the secret"
                  value={requestData.name}
                />
              </div>

              <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
                <label
                  className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                  htmlFor="secrete-note"
                >
                  Extra Note
                </label>
                <Input
                  className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                  disabled={isLoading}
                  id="secret-note"
                  onChange={(e) =>
                    setRequestData({
                      ...requestData,
                      note: e.target.value
                    })
                  }
                  placeholder="Enter the note of the secret"
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
                  onClick={handleAddSecret}
                >
                  Add Secret
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
