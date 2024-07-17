import * as React from 'react'
import { OTPInput, OTPInputContext } from 'input-otp'
import type { OTPInputProps } from 'input-otp'
import { Dot } from 'lucide-react'
import { cn } from '@/lib/utils'

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  OTPInputProps
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    className={cn('disabled:cursor-not-allowed', className)}
    containerClassName={cn(
      'flex items-center justify-center gap-2 has-[:disabled]:opacity-50',
      containerClassName
    )}
    ref={ref}
    {...props}
  />
))
InputOTP.displayName = 'InputOTP'

const InputOTPGroup = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ className, ...props }, ref) => (
  <div className={cn('flex items-center', className)} ref={ref} {...props} />
))
InputOTPGroup.displayName = 'InputOTPGroup'

const InputOTPSlot = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 items-center justify-center border-y border-r border-white/20 bg-neutral-800 text-sm  transition-all first:rounded-l-md first:border-l last:rounded-r-md dark:border-zinc-800',
        isActive &&
          'z-10 ring-2 ring-white/40 ring-offset-white dark:ring-zinc-300 dark:ring-offset-zinc-950',
        className
      )}
      ref={ref}
      {...props}
    >
      {char}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-zinc-950 duration-1000 dark:bg-zinc-50" />
        </div>
      ) : null}
    </div>
  )
})
InputOTPSlot.displayName = 'InputOTPSlot'

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<'div'>,
  React.ComponentPropsWithoutRef<'div'>
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Dot />
  </div>
))
InputOTPSeparator.displayName = 'InputOTPSeparator'

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
