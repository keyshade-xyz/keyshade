import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        className={cn(
          'bg-night-c focus-visible:outline-hidden border-white/16 flex h-10 w-full rounded-md border px-3 py-2 text-sm ring-offset-white/20 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:ring-[1px] focus-visible:ring-[#3B82F6] focus-visible:ring-offset-[1px] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        type={type}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
