/* eslint-disable @typescript-eslint/no-unsafe-assignment -- chill */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- chill */
'use client'
import { useRef } from 'react'
import {
  motion,
  useAnimationFrame,
  useMotionTemplate,
  useMotionValue,
  useTransform
} from 'framer-motion'
import { cn } from '@/utils/cn'

interface ButtonProps {
  borderRadius?: string
  children: React.ReactNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- it's okey
  as?: any
  containerClassName?: string
  borderClassName?: string
  duration?: number
  className?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- it's okey
  [key: string]: any
}

export function Button({
  borderRadius = '9999px',
  children,
  as: Component = 'button',
  containerClassName,
  borderClassName,
  duration,
  className
}: ButtonProps): React.JSX.Element {
  return (
    <Component
      className={cn(
        'gradBtnBg relative h-[2.6rem] w-[9rem]  overflow-hidden bg-transparent p-[1px] text-xl ',
        containerClassName
      )}
      style={{
        borderRadius
      }}
    >
      <div
        className="absolute inset-0"
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div
            className={cn(
              'h-[6rem] w-[6rem] bg-[radial-gradient(var(--white)_24%,transparent_60%)] opacity-[0.4]',
              borderClassName
            )}
          />
        </MovingBorder>
      </div>

      <div
        className={cn(
          'relative flex h-full w-full items-center justify-center border border-white/10 text-base antialiased backdrop-blur-xl',
          className
        )}
        style={{
          borderRadius: `calc(${borderRadius} * 0.96)`
        }}
      >
        <p className=" bg-gradient-to-b from-white/30 to-white bg-clip-text text-transparent">
          {children}
        </p>
      </div>
    </Component>
  )
}

export function MovingBorder({
  children,
  duration = 2000,
  rx,
  ry,
  ...otherProps
}: {
  children: React.ReactNode
  duration?: number
  rx?: string
  ry?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- it's
  [key: string]: any
}): React.JSX.Element {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ok
  const pathRef = useRef<any>()
  const progress = useMotionValue<number>(0)

  useAnimationFrame((time) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call -- chill
    const length = pathRef.current?.getTotalLength()
    if (length) {
      const pxPerMillisecond = length / duration
      progress.set((time * pxPerMillisecond) % length)
    }
  })

  const x = useTransform(
    progress,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- ignore
    (val) => pathRef.current?.getPointAtLength(val).x
  )
  const y = useTransform(
    progress,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- ignore
    (val) => pathRef.current?.getPointAtLength(val).y
  )

  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`

  return (
    <>
      <svg
        className="absolute h-full w-full"
        height="100%"
        preserveAspectRatio="none"
        width="100%"
        xmlns="http://www.w3.org/2000/svg"
        {...otherProps}
      >
        <rect
          fill="none"
          height="100%"
          ref={pathRef}
          rx={rx}
          ry={ry}
          width="100%"
        />
      </svg>
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          display: 'inline-block',
          transform
        }}
      >
        {children}
      </motion.div>
    </>
  )
}
