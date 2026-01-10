import * as React from 'react'
import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'border-input aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive min-h-19.5 shadow-xs scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/5 hover:scrollbar-thumb-white/10 flex w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition-[color,box-shadow] placeholder:text-white/50 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      data-slot="textarea"
      {...props}
    />
  )
}
Textarea.displayName = 'Textarea'

export { Textarea }
