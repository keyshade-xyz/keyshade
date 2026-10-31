'use client'

import { useState } from 'react'
import { Key, Copy, Check } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface CreateTokenDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateToken: (name: string, expiresAfterDays: number | null) => Promise<string | null>
}

const EXPIRY_OPTIONS = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
  { value: 'never', label: 'Never' }
]

export function CreateTokenDialog({
  open,
  onOpenChange,
  onCreateToken
}: CreateTokenDialogProps): JSX.Element {
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('30')
  const [isLoading, setIsLoading] = useState(false)
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValidName = /^[a-zA-Z0-9_-]+$/.test(name)

  const handleCreate = async () => {
    if (!name || !isValidName) return

    setIsLoading(true)
    setError(null)

    try {
      const expiresAfterDays = expiry === 'never' ? null : parseInt(expiry, 10)
      const token = await onCreateToken(name, expiresAfterDays)
      if (token) {
        setCreatedToken(token)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    if (createdToken) {
      await navigator.clipboard.writeText(createdToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleClose = () => {
    setName('')
    setExpiry('30')
    setCreatedToken(null)
    setCopied(false)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="rounded-lg border border-white/25 bg-[#18181B] sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Key className="h-5 w-5" />
            <DialogTitle className="text-lg font-semibold">
              {createdToken ? 'Token Created' : 'Create Personal Access Token'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm text-white/60">
            {createdToken
              ? 'Make sure to copy your token now. You won\'t be able to see it again!'
              : 'Personal access tokens are used to authenticate with the CLI and API.'}
          </DialogDescription>
        </DialogHeader>

        {createdToken ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
              <code className="flex-1 break-all text-sm text-green-400">
                {createdToken}
              </code>
              <Button
                onClick={handleCopy}
                size="icon"
                variant="ghost"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose} variant="primary">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="token-name">Token Name</Label>
              <Input
                id="token-name"
                onChange={(e) => setName(e.target.value)}
                placeholder="my-token"
                value={name}
              />
              {name && !isValidName && (
                <p className="text-xs text-red-400">
                  Only letters, numbers, underscores, and hyphens are allowed
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="token-expiry">Expiration</Label>
              <Select onValueChange={setExpiry} value={expiry}>
                <SelectTrigger id="token-expiry">
                  <SelectValue placeholder="Select expiration" />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <DialogFooter className="gap-2">
              <Button onClick={handleClose} variant="outline">
                Cancel
              </Button>
              <Button
                disabled={!name || !isValidName || isLoading}
                onClick={handleCreate}
                variant="primary"
              >
                {isLoading ? 'Creating...' : 'Create Token'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}