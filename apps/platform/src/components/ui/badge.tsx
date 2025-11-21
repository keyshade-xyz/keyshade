import type { ComponentPropsWithoutRef } from 'react'
import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { CircleCheckSVG, CloseCircleSVG, TimerSVG } from '@public/svg/badges'
import { cn } from '@/lib/utils'

const BadgeVarient = cva(
  'inline-flex justify-center items-center gap-2 border',
  {
    variants: {
      variant: {
        solid: '',
        subtle: 'bg-[#FFFFFF1A]! border border-[#FFFFFF33]! text-white!'
      },
      size: {
        default: 'font-medium text-sm py-[6px] px-3 rounded-lg ',
        small: 'text-xs font-base px-[6px] py-[2px] rounded-sm'
      }
    },
    defaultVariants: {
      variant: 'solid',
      size: 'default'
    }
  }
)

interface BaseBadgeProps {
  color: 'green' | 'red' | 'yellow' | 'blue' | `#${string}`
  variant: 'solid' | 'subtle'
}

interface DotBadgeProps extends BaseBadgeProps {
  type: 'dot' | 'none'
  icon?: never
}

interface IconBadgeProps extends BaseBadgeProps {
  type: 'icon'
  icon: 'done' | 'cancel' | 'waiting' | React.ReactElement
}

type BadgeProps = (DotBadgeProps | IconBadgeProps) &
  ComponentPropsWithoutRef<'span'> &
  VariantProps<typeof BadgeVarient>

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      className,
      children,
      color,
      variant,
      type,
      size,
      icon,
      ...props
    }: BadgeProps,
    ref
  ) => {
    const renderColor = (): `#${string}` => {
      switch (color) {
        case 'green':
          return '#16CF83'
        case 'blue':
          return '#0A9AF7'
        case 'red':
          return '#EC6A5B'
        case 'yellow':
          return '#FBD029'
        default:
          return color
      }
    }

    const renderIcons = () => {
      switch (icon) {
        case 'done':
          return <CircleCheckSVG />
        case 'cancel':
          return <CloseCircleSVG />
        case 'waiting':
          return <TimerSVG />

        default:
          return icon
      }
    }

    const renderType = (): React.JSX.Element | null => {
      if (type === 'dot') {
        return (
          <span
            className="h-[5px] w-[5px] rounded-full"
            style={{ backgroundColor: renderColor() }}
          />
        )
      }
      if (type === 'icon') {
        return renderIcons() as React.JSX.Element | null
      }
      return null
    }

    return (
      <span
        className={cn(BadgeVarient({ variant, size }), className)}
        ref={ref}
        style={{
          backgroundColor: variant === 'solid' ? `${renderColor()}1A` : '', // 10% opacity
          borderColor: variant === 'solid' ? `${renderColor()}33` : '', // 20% opacity
          color: variant === 'solid' ? renderColor() : ''
        }}
        {...props}
      >
        {renderType()}
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge }
