import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { AuthorityEnum, ExpiresAfterEnum } from '@keyshade/schema'
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
  selectedApiKeyAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import AuthoritySelector from '@/components/common/authority-selector'
import { useHttp } from '@/hooks/use-http'

function getExpiresAfterEnum(
  expiryDateString: string | null
): ExpiresAfterEnum {
  if (expiryDateString === null) {
    return 'never'
  }

  const expiryDate = dayjs(expiryDateString)
  const hoursDifference = expiryDate.diff(dayjs(), 'hours')

  if (hoursDifference <= 24) {
    return '24'
  } else if (hoursDifference <= 168) {
    return '168'
  } else if (hoursDifference <= 720) {
    return '720'
  }
  return '8760'
}

export default function EditApiKeySheet(): JSX.Element {
  const [isEditApiKeyOpen, setIsEditApiKeyOpen] = useAtom(editApiKeyOpenAtom)
  const [selectedApiKey, setSelectedApiKey] = useAtom(selectedApiKeyAtom)
  const setApiKeys = useSetAtom(apiKeysOfProjectAtom)

  const [isLoading, setIsLoading] = useState(false)
  const [requestData, setRequestData] = useState<{
    apiKeyName: string
    expiresAfter: ExpiresAfterEnum
  }>({
    apiKeyName: selectedApiKey!.name,
    expiresAfter: getExpiresAfterEnum(selectedApiKey!.expiresAt)
  })
  const [selectedPermissions, setSelectedPermissions] = useState<
    Set<AuthorityEnum>
  >(() => new Set(selectedApiKey?.authorities || []))

  const handleClose = useCallback(() => {
    setIsEditApiKeyOpen(false)
    setSelectedApiKey(null)
  }, [setIsEditApiKeyOpen, setSelectedApiKey])

  const editApiKey = useHttp(() =>
    ControllerInstance.getInstance().apiKeyController.updateApiKey({
      name:
        requestData.apiKeyName === selectedApiKey!.name
          ? undefined
          : requestData.apiKeyName.trim(),
      apiKeySlug: selectedApiKey!.slug,
      expiresAfter: requestData.expiresAfter,
      authorities: Array.from(selectedPermissions).flat()
    })
  )

  const updateApiKey = useCallback(async () => {
    if (selectedApiKey) {
      if (requestData.apiKeyName.trim() === '') {
        toast.error('Invalid API key name', {
          description: (
            <p className="text-xs text-rose-300">
              You can not have an empty API key name
            </p>
          )
        })
        return
      }

      setIsLoading(true)
      toast.loading('Updating your API Key...')

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
              if (a.id === selectedApiKey.id) {
                return data
              }
              return a
            })
            return newApiKeys
          })
        }
      } finally {
        toast.dismiss()
        setIsLoading(false)
        handleClose()
      }
    }
  }, [selectedApiKey, requestData, handleClose, setApiKeys, editApiKey])

  return (
    <Sheet onOpenChange={handleClose} open={isEditApiKeyOpen}>
      <SheetContent className="min-w-[33rem] overflow-y-auto border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Edit API Key</SheetTitle>
          <SheetDescription className="text-white/60" />
        </SheetHeader>
        <div className="grid gap-x-4 gap-y-6 py-8">
          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              API Key Name
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
              onValueChange={(val: ExpiresAfterEnum) =>
                setRequestData((prev) => ({
                  ...prev,
                  expiresAfter: val
                }))
              }
              value={requestData.expiresAfter}
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
        <SheetFooter className="sticky bottom-0 bg-[#222425] py-3">
          <SheetClose asChild>
            <Button
              className="font-semibold"
              disabled={isLoading}
              onClick={updateApiKey}
              variant="secondary"
            >
              Save changes
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
