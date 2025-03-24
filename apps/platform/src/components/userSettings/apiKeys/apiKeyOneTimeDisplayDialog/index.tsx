'use client'

import { useEffect, useState } from 'react'
import { useAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog'
import { 
  apiKeyOneTimeDisplayDialogOpenAtom, 
  oneTimeSecretValueAtom 
} from '@/store'
import { HiddenContent } from '@/components/shared/dashboard/hidden-content'

export function ApiKeyOneTimeDisplayDialog() {
  const [isOpen, setIsOpen] = useAtom(apiKeyOneTimeDisplayDialogOpenAtom)
  const [apiKeyValue, setApiKeyValue] = useAtom(oneTimeSecretValueAtom)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return null 
  }

  const handleClose = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      setApiKeyValue("") 
    }
  }

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
      <DialogOverlay className="bg-black/70" />
      <DialogContent className="w-full max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[50%] bg-[#18181B] border-[#27272A] text-white z-50">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">
              API Key Created!
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            Your API key has been created. Save it for your future use, you will not be able to view it again.
          </p>

          <HiddenContent isPrivateKey value={apiKeyValue} />

          <div className="p-3 rounded-lg border border-white/25">
            <p className="text-sm flex items-center gap-2">
              <span>⚠️</span>
              This is the only time the API key will be shown. Make sure to copy it now!
            </p>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              className="bg-white text-black hover:bg-gray-200"
              onClick={() => handleClose(false)}
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
