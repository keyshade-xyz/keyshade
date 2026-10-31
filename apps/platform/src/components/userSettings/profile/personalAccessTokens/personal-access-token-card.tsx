'use client'

import { useState } from 'react'
import { Key, MoreVertical, RefreshCw, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface PersonalAccessTokenCardProps {
  id: string
  name: string
  createdAt: string
  expiresOn: string | null
  lastUsedOn: string | null
  onDelete: (id: string) => void
  onRegenerate: (id: string) => void
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getExpiryStatus(expiresOn: string | null): {
  text: string
  className: string
} {
  if (!expiresOn) {
    return { text: 'Never expires', className: 'text-white/60' }
  }
  const now = new Date()
  const expiry = new Date(expiresOn)
  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilExpiry < 0) {
    return { text: 'Expired', className: 'text-red-400' }
  } else if (daysUntilExpiry <= 7) {
    return { text: `Expires in ${daysUntilExpiry} days`, className: 'text-yellow-400' }
  } else {
    return { text: `Expires ${formatDate(expiresOn)}`, className: 'text-white/60' }
  }
}

export function PersonalAccessTokenCard({
  id,
  name,
  createdAt,
  expiresOn,
  lastUsedOn,
  onDelete,
  onRegenerate
}: PersonalAccessTokenCardProps): JSX.Element {
  const [copied, setCopied] = useState(false)
  const expiryStatus = getExpiryStatus(expiresOn)

  const copyId = async () => {
    await navigator.clipboard.writeText(id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 p-4">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5">
          <Key className="h-5 w-5 text-white/60" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{name}</span>
            <span className={`text-xs ${expiryStatus.className}`}>
              {expiryStatus.text}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/40">
            <span>Created {formatDate(createdAt)}</span>
            <span>•</span>
            <span>Last used {formatDate(lastUsedOn)}</span>
            <button
              className="flex items-center gap-1 hover:text-white/60"
              onClick={copyId}
              title="Copy token ID"
              type="button"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="flex items-center gap-2"
            onClick={() => onRegenerate(id)}
          >
            <RefreshCw className="h-4 w-4" />
            Regenerate
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2 text-red-400 focus:text-red-400"
            onClick={() => onDelete(id)}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}