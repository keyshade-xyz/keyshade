'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { copyToClipboard } from '@/lib/clipboard'

interface CommandSuggestionProps {
  privatekey: string
  value: string
}

export function CommandSuggestion({
  value,
  privatekey
}: CommandSuggestionProps) {
  const [copied, setCopied] = useState(false)

  const command = `${value  } ${  privatekey}`
  const handleCopyToClipboard = () => {
    copyToClipboard(
      command,
      `You copied the Configuration command successfully.`,
      `Failed to copy the Configuration command.`
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const maskedCommand = `${value  } ${  privatekey.slice(0, 40).replace(/./g, '•')}`

  return (
    <div className="relative flex items-center">
      <div className="flex w-full text-wrap rounded-md border border-white/10 bg-neutral-800 px-3 py-2 pr-12 font-mono text-sm text-white/70 ring-offset-white/20 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300">
        {maskedCommand}
      </div>

      <div className="absolute right-1 flex items-center gap-1">
        <Button
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
          className="h-8 w-8"
          onClick={handleCopyToClipboard}
          size="icon"
          type="button"
          variant="ghost"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
