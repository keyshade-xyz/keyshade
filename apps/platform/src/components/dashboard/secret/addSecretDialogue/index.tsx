import React, { useCallback, useState } from 'react'
import { AddSVG } from '@public/svg/shared'
import type { CreateSecretRequest } from '@keyshade/schema'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../../../ui/dialog'
import { Button } from '../../../ui/button'
import { Input } from '../../../ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '../../../ui/select'
import ControllerInstance from '@/lib/controller-instance'
import {
  createSecretOpenAtom,
  selectedProjectAtom,
  environmentsOfProjectAtom,
  secretsOfProjectAtom
} from '@/store'

export default function AddSecretDialog() {
  const [isCreateSecretOpen, setIsCreateSecretOpen] =
    useAtom(createSecretOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const environments = useAtomValue(environmentsOfProjectAtom)
  const setSecrets = useSetAtom(secretsOfProjectAtom)

  const [newSecretData, setNewSecretData] = useState({
    secretName: '',
    secretNote: '',
    environmentSlug: environments[0]?.slug,
    environmentValue: ''
  })

  const handleAddSecret = useCallback(async () => {
    if (selectedProject === null) {
      toast.error('No project selected', {
        description: (
          <p className="text-xs text-red-300">
            No project selected. Please select a project.
          </p>
        )
      })
      throw new Error("Current project doesn't exist")
    }

    const request: CreateSecretRequest = {
      name: newSecretData.secretName,
      projectSlug: selectedProject.slug,
      entries: newSecretData.environmentValue
        ? [
            {
              value: newSecretData.environmentValue,
              environmentSlug: newSecretData.environmentSlug
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
      // Add the new secret to the list of secrets
      setSecrets((prev) => [...prev, data])
    }
    if (error) {
      if (error.statusCode === 409) {
        toast.error('Secret already exists', {
          description: (
            <p className="text-xs text-red-300">
              A secret with the same name already exists. Please use a different
              one.
            </p>
          )
        })
      } else {
        toast.error('Something went wrong!', {
          description: (
            <p className="text-xs text-red-300">
              Something went wrong while adding the secret. Check the console
              for more details.
            </p>
          )
        })
        // eslint-disable-next-line no-console -- we need to log the error that are not in the if condition
        console.error(error)
      }
    }

    setNewSecretData({
      secretName: '',
      secretNote: '',
      environmentSlug: '',
      environmentValue: ''
    })
    setIsCreateSecretOpen(false)
  }, [selectedProject, newSecretData, setIsCreateSecretOpen, setSecrets])

  return (
    <Dialog
      onOpenChange={() => setIsCreateSecretOpen(!isCreateSecretOpen)}
      open={isCreateSecretOpen}
    >
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
                  defaultValue={newSecretData.environmentSlug}
                  onValueChange={(val) =>
                    setNewSecretData({
                      ...newSecretData,
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
                onClick={handleAddSecret}
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
