import { useState, useEffect } from 'react'
import { Copy, Check, X, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog'

interface OneTimeSecretDisplayProps {
  open: boolean
  secretValue: string
  onOpenChange: (open: boolean) => void
}

export function OneTimeSecretDisplay({
  open,
  secretValue,
  onOpenChange,
}: OneTimeSecretDisplayProps) {
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
    onOpenChange(false)
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
    <Dialog onOpenChange={handleClose} open={open}>
      <DialogOverlay className="bg-black/70" />
      <DialogContent className="sm:max-w-[425px] bg-[#18181B] border-[#27272A] text-white z-50">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-lg font-semibold">
              {copied ? (
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-green-400 mr-2" />
                  <span>Your API Key is copied!</span>
                </div>
              ) : (
                "API Key Created!"
              )}
            </DialogTitle>
            <Button
              className="h-8 w-8 p-0 text-gray-400 hover:bg-[#27272A] hover:text-white"
              onClick={handleClose}
              size="sm"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-300 text-sm">
            {copied ? 
              "Your API key has been copied to clipboard." : 
              "Your API key has been created. Save it for your future use, you would not be able to view it again."}
          </p>
          <div className="relative bg-[#262626] p-4 rounded-lg flex items-center">
            <code className="break-all font-mono text-sm text-gray-300 flex-grow pr-16">
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
          <div className="p-3 bg-red-900/20 rounded-lg border border-red-800/30">
            <p className="text-sm text-red-400 flex items-center gap-2">
              <span>⚠️</span>
              This is the only time the API key will be shown. Make sure to
              copy it now!
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