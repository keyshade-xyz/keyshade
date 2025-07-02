'use client'

import * as React from 'react'
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-3', className)}
      data-slot="radio-group"
      {...props}
    />
  )
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      className={cn(
        'aria-invalid:ring-red-500/20 dark:aria-invalid:ring-red-500/40 aria-invalid:border-red-500 shadow-xs dark:aria-invalid:ring-red-900/20 dark:dark:aria-invalid:ring-red-900/40 dark:aria-invalid:border-red-900 aspect-square size-4 shrink-0 rounded-full border border-zinc-200 bg-white outline-none transition-shadow focus-visible:border-zinc-950 focus-visible:ring-[3px] focus-visible:ring-zinc-950/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-zinc-900 data-[state=checked]:bg-white dark:border-zinc-800 dark:bg-white dark:focus-visible:border-zinc-300 dark:focus-visible:ring-zinc-300/50 dark:data-[state=checked]:border-zinc-900 dark:data-[state=checked]:bg-white',
        className
      )}
      data-slot="radio-group-item"
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center text-black">
        <svg
          fill="currentcolor"
          height="6"
          viewBox="0 0 6 6"
          width="6"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="3" cy="3" r="3" />
        </svg>
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

export { RadioGroup, RadioGroupItem }
