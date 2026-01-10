import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap gap-1 cursor-pointer rounded-md text-sm font-normal ring-offset-blue-500 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:text-white/56 disabled:border disabled:border-[#FAFAFA]/10',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-700 border border-white/16 shadow-inherit text-white hover:bg-primary-800 ',
        secondary:
          'bg-primary-1000 text-primary-400 border border-primary-400 hover:bg-primary-1100 hover:border-primary-200',
        outline:
          'border border-white/8 text-white hover:border-white/4 hover:text-white/80 bg-zinc-900',
        danger: 'bg-red-600 text-white hover:bg-red-700',
        ghost:
          'hover:text-white/70 disabled:bg-transparent disabled:border-transparent',
        link: 'text-primary-300 underline-offset-4 hover:underline disabled:text-primary-300/56 disabled:border-transparent'
      },
      size: {
        default: 'px-3 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
