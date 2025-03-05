'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { TrashSVG } from '@public/svg/shared'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import ControllerInstance from '@/lib/controller-instance'
import {
  deleteApiKeyOpenAtom,
  apiKeysOfProjectAtom,
  selectedApiKeyAtom
} from '@/store'
import { Input } from '@/components/ui/input'

export default function ConfirmDeleteApiKey(): React.JSX.Element {
  const selectedApiKey = useAtomValue(selectedApiKeyAtom)
  const [isDeleteApiKeyOpen, setIsDeleteApiKeyOpen] =
    useAtom(deleteApiKeyOpenAtom)
  const setApiKeys = useSetAtom(apiKeysOfProjectAtom)

  const [confirmName, setConfirmName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleClose = useCallback(() => {
    setIsDeleteApiKeyOpen(false)
  }, [setIsDeleteApiKeyOpen])

  const deleteApiKey = useCallback(async () => {
    if (selectedApiKey === null) {
      toast.error('No API Key selected', {
        description: (
          <p className="text-xs text-red-300">
            No API Key selected. Please select an API Key.
          </p>
        )
      })
      return
    }

    const apiKeySlug = selectedApiKey.slug

    setIsLoading(true)
    try {
      toast.loading('Deleting your API Key...')
      const { success } =
        await ControllerInstance.getInstance().apiKeyController.deleteApiKey(
          { apiKeySlug },
          {}
        )

      if (success) {
        toast.success('API Key deleted successfully', {
          description: (
            <p className="text-xs text-emerald-300">
              The API Key has been deleted.
            </p>
          )
        })

        // Remove the API Key from the store
        setApiKeys((prevApiKeys) =>
          prevApiKeys.filter((apiKey) => apiKey.slug !== apiKeySlug)
        )
      }
    } finally {
      toast.dismiss()
      handleClose()
      setIsLoading(false)
    }
  }, [setApiKeys, selectedApiKey, handleClose])

  //Cleaning the pointer events for the context menu after closing the alert dialog
  const cleanup = useCallback(() => {
    document.body.style.pointerEvents = ''
    document.documentElement.style.pointerEvents = ''
  }, [])

  useEffect(() => {
    if (!isDeleteApiKeyOpen) {
      cleanup()
    }
    return () => cleanup()
  }, [isDeleteApiKeyOpen, cleanup])

  return (
    <AlertDialog
      aria-hidden={!isDeleteApiKeyOpen}
      onOpenChange={handleClose}
      open={isDeleteApiKeyOpen}
    >
      <AlertDialogContent className="rounded-lg border border-white/25 bg-[#18181B] ">
        <AlertDialogHeader>
          <div className="flex items-center gap-x-3">
            <TrashSVG />
            <AlertDialogTitle className="text-lg font-semibold">
              Do you want to delete {selectedApiKey?.name} ?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm font-normal leading-5 text-[#71717A]">
            This action cannot be undone. This will permanently delete your API
            and remove your API key data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex w-full flex-col gap-y-5 text-sm">
          To confirm that you really want to delete this API key, please type in
          the name of the API key below.
          <Input
            className="w-full"
            onChange={(e) => setConfirmName(e.target.value)}
            placeholder={selectedApiKey?.name}
            type="text"
            value={confirmName}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            className="rounded-md bg-[#F4F4F5] text-black hover:bg-[#F4F4F5]/80 hover:text-black"
            onClick={handleClose}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="rounded-md bg-[#DC2626] text-white hover:bg-[#DC2626]/80"
            disabled={isLoading || confirmName !== selectedApiKey?.name}
            onClick={deleteApiKey}
          >
            Yes, delete {selectedApiKey ? selectedApiKey.name : 'this API Key'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
