import React from 'react'
import { AddSVG } from '@public/svg/shared'
import type { CreateSecretRequest, Environment } from '@keyshade/schema'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from './dialog'
import { Button } from './button'
import { Input } from './input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from './select'
import ControllerInstance from '@/lib/controller-instance'

interface NewSecretData {
  secretName: string
  secretNote: string
  environmentName: string
  environmentValue: string
}

function AddSecretDialog({
  setIsOpen,
  isOpen,
  newSecretData,
  setNewSecretData,
  availableEnvironments,
  currentProjectSlug
}: {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isOpen: boolean
  newSecretData: NewSecretData
  setNewSecretData: React.Dispatch<React.SetStateAction<NewSecretData>>
  availableEnvironments: Environment[]
  currentProjectSlug: string
}) {
  const addSecret = async () => {
    if (currentProjectSlug === '') {
      throw new Error("Current project doesn't exist")
    }

    const request: CreateSecretRequest = {
      name: newSecretData.secretName,
      projectSlug: currentProjectSlug,
      entries: newSecretData.environmentValue
        ? [
            {
              value: newSecretData.environmentValue,
              environmentSlug: newSecretData.environmentName
            }
          ]
        : undefined,
      note: newSecretData.secretNote
    }

    const { success, error, data } =
      await ControllerInstance.getInstance().secretController.createSecret(
        request,
        {}
      )

    if (success && data) {
      toast.success('Secret added successfully', {
        description: (
          <p className="text-xs text-emerald-300">You created a new secret</p>
        )
      })
    }
    if (error) {
      if (error.statusCode === 409) {
        toast.error('Secret name already exists', {
          description: (
            <p className="text-xs text-red-300">
              Secret name already exists. Please use a different one.
            </p>
          )
        })
      } else {
        // eslint-disable-next-line no-console -- we need to log the error that are not in the if condition
        console.error(error)
      }
    }

    setNewSecretData({
      secretName: '',
      secretNote: '',
      environmentName: '',
      environmentValue: ''
    })
    setIsOpen(false)
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-[#26282C] hover:bg-[#161819] hover:text-white/55"
          variant="outline"
        >
          <AddSVG /> Add Secret
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[25rem] w-[31.625rem] bg-[#18181B] text-white ">
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
                id="secret-name"
                onChange={(e) =>
                  setNewSecretData({
                    ...newSecretData,
                    secretName: e.target.value
                  })
                }
                placeholder="Enter the key of the secret"
                value={newSecretData.secretName}
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
                id="secret-note"
                onChange={(e) =>
                  setNewSecretData({
                    ...newSecretData,
                    secretNote: e.target.value
                  })
                }
                placeholder="Enter the note of the secret"
                value={newSecretData.secretNote}
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
                  defaultValue="development"
                  onValueChange={(val) =>
                    setNewSecretData({
                      ...newSecretData,
                      environmentName: val
                    })
                  }
                >
                  <SelectTrigger className="h-[2.75rem] w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300">
                    <SelectValue placeholder="Select environment" />
                  </SelectTrigger>
                  <SelectContent className=" w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300">
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
                  className="h-[1.25rem] w-[9.75rem] text-base font-semibold"
                  htmlFor="env-value"
                >
                  Environment Value
                </label>
                <Input
                  className="h-[2.75rem] w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                  id="env-value"
                  onChange={(e) =>
                    setNewSecretData({
                      ...newSecretData,
                      environmentValue: e.target.value
                    })
                  }
                  placeholder="Environment Value"
                  value={newSecretData.environmentValue}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                className="h-[2.625rem] w-[6.25rem] rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                onClick={addSecret}
              >
                Add Secret
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddSecretDialog
