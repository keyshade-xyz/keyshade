'use client'
import { useState, useEffect } from 'react'
import { useAtom } from 'jotai'
import { Copy, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog'
import { oneTimeSecretDisplayAtom } from '@/store'

interface OneTimeSecretDisplayProps {
  secretValue: string
  title?: string
  description?: string
  warningMessage?: string
}

export function OneTimeSecretDisplay({
  secretValue,
  title = "API Key Created!",
  description = "Your API key has been created. Save it for your future use, you will not be able to view it again.",
  warningMessage = "This is the only time the API key will be shown. Make sure to copy it now!"
}: OneTimeSecretDisplayProps) {
  const [isOpen, setIsOpen] = useAtom(oneTimeSecretDisplayAtom)
  const [copied, setCopied] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(secretValue)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleClose = () => {
    setIsOpen(false)
  }

  const toggleSecretVisibility = () => {
    setShowSecret(!showSecret)
  }

  const maskSecret = (secret: string) => {
    return '*'.repeat(secret.length)
  }

  if (!hasMounted) {
    return null
  }

  return (
    <Dialog onOpenChange={handleClose} open={isOpen}>
      <DialogOverlay className="bg-black/70" />
      <DialogContent className="w-full max-w-[90%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[50%] bg-[#18181B] border-[#27272A] text-white z-50">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">
              {copied ? (
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span>Your API Key is copied!</span>
                </div>
              ) : (
                title
              )}
            </DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            {copied ?
              "Your API key has been copied to clipboard." :
              description}
          </p>
          <div className="relative bg-[#262626] p-4 rounded-lg flex items-center max-w-full overflow-x-auto">
            <code className="font-mono text-sm text-gray-300 pr-4 whitespace-normal md:whitespace-nowrap">
              {showSecret ? secretValue : maskSecret(secretValue)}
            </code>

            <div className="absolute right-2 flex space-x-1">
              <Button
                className="text-gray-400 hover:bg-[#3F3F46]"
                onClick={toggleSecretVisibility}
                size="sm"
                title={showSecret ? "Hide API key" : "Show API key"}
                variant="ghost"
              >
                {showSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                className="text-gray-400 hover:bg-[#3F3F46]"
                onClick={handleCopy}
                size="sm"
                title="Copy to clipboard"
                variant="ghost"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="p-3  rounded-lg border ">
            <p className="text-sm  flex items-center gap-2">
              <span>⚠️</span>
              {warningMessage}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              className="bg-white text-black hover:bg-gray-200"
              onClick={handleClose}
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}