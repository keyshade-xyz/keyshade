import React, { useCallback, useState } from 'react'
import type { CreateApiKeyRequest, AuthorityEnum } from '@keyshade/schema'
import { toast } from 'sonner'
import { useAtom, useSetAtom } from 'jotai'
import { AddSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import ControllerInstance from '@/lib/controller-instance'
import { createApiKeyOpenAtom, apiKeysOfProjectAtom } from '@/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { useHttp } from '@/hooks/use-http'
import AuthoritySelector from '@/components/common/authority-selector'
import CopyToClipboard from '@/components/common/copy-to-clipboard'

export default function AddApiKeyDialog() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateApiKeyOpen, setIsCreateApiKeyOpen] =
    useAtom(createApiKeyOpenAtom)
  const setApiKeys = useSetAtom(apiKeysOfProjectAtom)
  const [newApiKeyData, setNewApiKeyData] = useState<CreateApiKeyRequest>({
    name: '',
    expiresAfter: '24'
  })

  const [selectedPermissions, setSelectedPermissions] = useState<
    Set<AuthorityEnum>
  >(new Set())

  const createApiKey = useHttp(() =>
    ControllerInstance.getInstance().apiKeyController.crateApiKey({
      name: newApiKeyData.name,
      expiresAfter: newApiKeyData.expiresAfter,
      authorities: Array.from(selectedPermissions).flat()
    })
  )

  const handleAddApiKey = useCallback(async () => {
    if (newApiKeyData.name.trim() === '') {
      toast.error('API Key name is required')
      return
    }

    setIsLoading(true)
    toast.loading('Creating your API Key...')
    try {
      const { success, data } = await createApiKey()

      if (success && data) {
        setApiKeys((prev) => [...prev, data])
        toast.success(`Created API Key`, {
          description: (
            <div className="mt-1 flex flex-col gap-y-2 text-green-300">
              <p>
                Your API key just got created. Make sure to copy it and store it
                securely. You will not be able to see it again.
              </p>
              <CopyToClipboard text={data.value} />
            </div>
          ),
          className: 'w-fit absolute bottom-0 right-0'
        })
      }
    } finally {
      toast.dismiss()
      setIsLoading(false)
      setNewApiKeyData({
        name: '',
        expiresAfter: 'never'
      })
      setIsCreateApiKeyOpen(false)
      setSelectedPermissions(new Set())
    }
  }, [newApiKeyData.name, createApiKey, setApiKeys, setIsCreateApiKeyOpen])

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
      <DialogContent className="flex h-[85vh] min-w-[42rem] flex-col bg-[#18181B] text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Add a new API Key
          </DialogTitle>
          <DialogDescription>
            Adding a new API key to the workspace enables you to interact with
            the various entities of the workspace from your codebase or any CI
            tool.
          </DialogDescription>
        </DialogHeader>

        <div className="text-white">
          <div className="space-y-4">
            <div className="flex h-[2.75rem] items-center justify-start gap-6">
              <label
                className="h-[1.25rem] w-[7rem] text-base font-semibold"
                htmlFor="secret-name"
              >
                API Key Name
              </label>
              <Input
                className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300 placeholder:text-gray-500"
                id="secret-name"
                onChange={(e) =>
                  setNewApiKeyData((prev) => ({
                    ...prev,
                    name: e.target.value
                  }))
                }
                placeholder="Enter the API key"
                value={newApiKeyData.name}
              />
            </div>

            <div className="flex h-[2.75rem] items-center justify-start gap-6">
              <label
                className="h-[1.25rem] w-[7rem] text-base font-semibold"
                htmlFor="expiry-date"
              >
                Expiry Date
              </label>
              <Select
                defaultValue="24"
                onValueChange={(val) =>
                  setNewApiKeyData((prev) => ({
                    ...prev,
                    expiresAfter: val
                  }))
                }
                value={newApiKeyData.expiresAfter}
              >
                <SelectTrigger className="h-[2.75rem] w-[20rem] border border-white/10 bg-neutral-800 text-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border border-white/10 bg-neutral-800 text-gray-300">
                  <SelectItem value="24"> 1 day </SelectItem>
                  <SelectItem value="168"> 1 week </SelectItem>
                  <SelectItem value="720"> 1 month </SelectItem>
                  <SelectItem value="8760"> 1 year </SelectItem>
                  <SelectItem value="never"> Never </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <AuthoritySelector
              selectedPermissions={selectedPermissions}
              setSelectedPermissions={setSelectedPermissions}
            />

            <div className="flex justify-end pt-4">
              <Button
                className="h-[2.625rem] w-[6.25rem] rounded-lg bg-white text-xs font-semibold text-black hover:bg-gray-200"
                disabled={isLoading}
                onClick={handleAddApiKey}
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
