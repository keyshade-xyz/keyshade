import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { CreateApiKeyRequest, UpdateApiKeyRequest, AuthorityEnum } from '@keyshade/schema'
import dayjs from 'dayjs'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  apiKeysOfProjectAtom,
  editApiKeyOpenAtom,
  selectedApiKeyAtom,
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import AuthoritySelector from '@/components/common/authority-selector'
import { useHttp } from '@/hooks/use-http'

export default function EditApiKeySheet(): JSX.Element {
  const [isLoading, setIsLoading] = useState(false)
  const [isEditApiKeyOpen, setIsEditApiKeyOpen] = useAtom(editApiKeyOpenAtom)
  const selectedApiKeyData = useAtomValue(selectedApiKeyAtom)
  const setApiKeys = useSetAtom(apiKeysOfProjectAtom)

  const [requestData, setRequestData] = useState<{
    apiKeyName: string | undefined
    expiryDate: string | null
  }>({
    apiKeyName: selectedApiKeyData?.name,
    expiryDate: selectedApiKeyData?.expiresAt !== null ? dayjs(selectedApiKeyData?.expiresAt).diff(dayjs(), 'hour').toString() : 'never'
  })
  const [selectedPermissions, setSelectedPermissions] = useState<
    Set<AuthorityEnum>
  >(() => {
    if (selectedApiKeyData?.authorities && Array.isArray(selectedApiKeyData.authorities)) {
      return new Set(selectedApiKeyData.authorities);
    }
    return new Set();
  });

  const handleClose = useCallback(() => {
    setIsEditApiKeyOpen(false)
  }, [setIsEditApiKeyOpen])

  // Create a new array from selectedPermissions to ensure we have the latest state
  const authoritiesArray = Array.from(selectedPermissions).flat() as CreateApiKeyRequest['authorities']

  const request: UpdateApiKeyRequest = {
    name:
      !requestData.apiKeyName?.trim() || requestData.apiKeyName === selectedApiKeyData!.name
        ? undefined
        : requestData.apiKeyName.trim(),
    apiKeySlug: selectedApiKeyData!.slug,
    expiresAfter: requestData.expiryDate as 'never' | '24' | '168' | '720' | '8760',
    authorities: authoritiesArray
  }

  const editApiKey = useHttp(() =>
    ControllerInstance.getInstance().apiKeyController.updateApiKey(
      request,
      {}
    )
  )

  const updateApiKey = useCallback(async () => {
    if (!selectedApiKeyData) {
      toast.error('No API Key selected', {
        description: (
          <p className="text-xs text-red-300">
            No API selected. Please select an API Key.
          </p>
        )
      })
      return
    }

    if (!requestData.apiKeyName || !requestData.expiryDate) {
      toast.error('Both fields are mandatory')
      return
    }

    if (requestData.apiKeyName.trim() === '') {
      toast.error('API Key name is required')
      return
    }

    setIsLoading(true)
    toast.loading("Updating your API Key...")
    try {
      const { success, data } = await editApiKey() 

      if (success && data) {
        toast.success('API Key edited successfully', {
          description: (
            <p className="text-xs text-emerald-300">
              You successfully edited the API Key
            </p>
          )
        })

        // Update the API Keys in the store
        setApiKeys((prev) => {
          const newApiKeys = prev.map((a) => {
            if (a.slug === selectedApiKeyData.slug) {
              const newExpiresAt = requestData.expiryDate === 'never' ? null : new Date(Date.now() + Number(requestData.expiryDate) * 60 * 60 * 1000).toISOString();
              const updatedApiKey = {
                ...a,
                name: requestData.apiKeyName || a.name,
                expiresAt: newExpiresAt,
                authorities: authoritiesArray,
                slug: data.slug
              };
              return updatedApiKey;
            }
            return a;
          });
          return newApiKeys;
        })
      }
    } finally {
      toast.dismiss()
      setIsLoading(false)
    }

    handleClose()
  }, [selectedApiKeyData, requestData, handleClose, setApiKeys, editApiKey, authoritiesArray])

  useEffect(() => {
    if (selectedApiKeyData?.authorities && Array.isArray(selectedApiKeyData.authorities)) {
      setSelectedPermissions(new Set(selectedApiKeyData.authorities));

      setRequestData({
        apiKeyName: selectedApiKeyData.name,
        expiryDate: selectedApiKeyData.expiresAt !== null ? dayjs(selectedApiKeyData.expiresAt).diff(dayjs(), 'hour').toString() : 'never'
      });
    }
  }, [selectedApiKeyData]);

  return (
    <Sheet
      onOpenChange={(open) => {
        setIsEditApiKeyOpen(open)
      }}
      open={isEditApiKeyOpen}
    >
      <SheetContent className="min-w-[33rem] border-white/15 bg-[#222425] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white">Edit API Key</SheetTitle>
          <SheetDescription className="text-white/60" />
        </SheetHeader>
        <div className="grid gap-x-4 gap-y-6 py-8">
          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              Key Name
            </Label>
            <Input
              className="col-span-3 h-[2.75rem]"
              id="name"
              onChange={(e) => {
                setRequestData((prev) => ({
                  ...prev,
                  apiKeyName: e.target.value
                }))
              }}
              placeholder="Enter the name of the API key"
              value={requestData.apiKeyName}
            />
          </div>

          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              Expiry Date
            </Label>
            <Select
              onValueChange={(val) =>
                setRequestData((prev) => ({
                  ...prev,
                  expiryDate: val === 'never' ? 'never' : val
                }))
              }
              value={
                !requestData.expiryDate ? undefined :
                  requestData.expiryDate === 'never' ? 'never' :
                    Number(requestData.expiryDate) <= 24 ? '24' :
                      Number(requestData.expiryDate) > 24 && Number(requestData.expiryDate) <= 168 ? '168' :
                        Number(requestData.expiryDate) > 168 && Number(requestData.expiryDate) <= 720 ? '720' :
                          Number(requestData.expiryDate) > 720 && Number(requestData.expiryDate) <= 8760 ? '8760' : undefined
              }
            >
              <SelectTrigger className="h-[2.75rem] border border-white/10 bg-neutral-800 text-gray-300">
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

          <div className="h-[300px] overflow-y-auto">
            <AuthoritySelector
              isSheet
              selectedPermissions={selectedPermissions}
              setSelectedPermissions={setSelectedPermissions}
            />
          </div>
        </div>
        <SheetFooter className="py-3 sticky bottom-0 bg-[#222425]">
          <SheetClose asChild>
            <Button
              className="font-semibold"
              disabled={isLoading}
              onClick={updateApiKey}
              variant="secondary"
            >
              Edit API Key
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}