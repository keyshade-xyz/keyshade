import React, { useCallback, useState } from 'react'
import { AddSVG } from '@public/svg/shared'
import type { CreateApiKeyRequest } from '@keyshade/schema'
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
  createApiKeyOpenAtom,
  apiKeysOfProjectAtom
} from '@/store'

export default function AddApiKeyDialog() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateApiKeyOpen, setIsCreateApiKeyOpen] = useAtom(createApiKeyOpenAtom)
  const setApiKeys = useSetAtom(apiKeysOfProjectAtom)

  const [newApiKeyData, setNewApiKeyData] = useState({
    apiKeyName: '',
    expiryDate: '24'
  })

  const handleAddApiKey = useCallback(async () => {
    setIsLoading(true)

    if (!newApiKeyData.apiKeyName) {
      toast.error('API Key name is required')
      return
    }
    if (!newApiKeyData.expiryDate) {
      toast.error('Expiry Date is required')
      return
    }

    const request: CreateApiKeyRequest = {
      name: newApiKeyData.apiKeyName,
      expiresAfter: newApiKeyData.expiryDate as "never" | "24" | "168" | "720" | "8760" | undefined
    }

    toast.loading("Creating your API Key...")
    const { success, error, data } = await ControllerInstance.getInstance().apiKeyController.crateApiKey(
      request,
      {}
    )

    toast.dismiss()
    if (success && data) {
      toast.success('API Key added successfully', {
        description: (
          <p className="text-xs text-emerald-300">You created a new API Key</p>
        )
      })
      // Add the new API Key to the list of keys
      setApiKeys((prev) => [...prev, data])
    }
    if (error) {
      toast.dismiss()
      if (error.statusCode === 409) {
        toast.error('API Key already exists', {
          description: (
            <p className="text-xs text-red-300">
              An API Key with the same name already exists. Please use a different one.
            </p>
          )
        })
      } else {
        toast.error('Something went wrong!', {
          description: (
            <p className="text-xs text-red-300">
              Something went wrong while adding the API Key. Check the console for more details.
            </p>
          )
        })
        // eslint-disable-next-line no-console -- we need to log the error that are not in the if condition
        console.error(error)
      }
    }

    setNewApiKeyData({
      apiKeyName: '',
      expiryDate: ''
    })
    setIsLoading(false)
    setIsCreateApiKeyOpen(false)
  }, [newApiKeyData, setIsCreateApiKeyOpen, setApiKeys])

  return (
    <Dialog
      onOpenChange={() => setIsCreateApiKeyOpen(!isCreateApiKeyOpen)}
      open={isCreateApiKeyOpen}
    >
      <DialogTrigger asChild>
        <Button
          className="bg-[#26282C] hover:bg-[#161819] hover:text-white/55"
          variant="outline"
        >
          <AddSVG /> Add API Key
        </Button>
      </DialogTrigger>
      <DialogContent className=" w-[31.625rem] bg-[#18181B] text-white ">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Add a new API Key
          </DialogTitle>
          <DialogDescription>
            Add a new API key to the project
          </DialogDescription>
        </DialogHeader>

        <div className=" text-white">
          <div className="space-y-4">
            <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
              <label
                className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                htmlFor="secret-name"
              >
                API Key Name
              </label>
              <Input
                className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                id="secret-name"
                onChange={(e) =>
                  setNewApiKeyData({
                    ...newApiKeyData,
                    apiKeyName: e.target.value
                  })
                }
                placeholder="Enter the API key"
                value={newApiKeyData.apiKeyName}
              />
            </div>

            <div className="flex h-[2.75rem] w-[28.625rem] items-center justify-center gap-6">
              <label
                className="h-[1.25rem] w-[7.125rem] text-base font-semibold"
                htmlFor="secrete-note"
              >
                Expiry Date
              </label>
              <Select
                defaultValue="24"
                onValueChange={(val) =>
                  setNewApiKeyData({
                    ...newApiKeyData,
                    expiryDate: val
                  })
                }
              >
                <SelectTrigger className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className=" border border-white/10 bg-neutral-800 text-gray-300">
                  <SelectItem value="24"> 1 day </SelectItem>
                  <SelectItem value="168"> 1 week </SelectItem>
                  <SelectItem value="720"> 1 month </SelectItem>
                  <SelectItem value="8760"> 1 year </SelectItem>
                  <SelectItem value="never"> Never </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                className="h-[2.625rem] w-[6.25rem] rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                onClick={handleAddApiKey}
                disabled={isLoading}
              >
                Add API Key
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
