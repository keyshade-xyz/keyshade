/* eslint-disable @typescript-eslint/no-unsafe-assignment -- ignore */
/* eslint-disable @typescript-eslint/no-explicit-any -- ignore */
'use client'
import React, { useEffect, useRef, useState, memo } from 'react'
import { motion } from 'framer-motion'
import { twMerge } from 'tailwind-merge'
import { cn } from '@/utils/cn'

interface TextRevealCardProps {
  text: string
  revealText: string
  children?: React.ReactNode
  className?: string
}

export function TextRevealCard({
  text,
  revealText,
  children,
  className
}: TextRevealCardProps): React.JSX.Element {
  const [widthPercentage, setWidthPercentage] = useState(0)
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents -- ignore
  const cardRef = useRef<HTMLDivElement | any>(null)
  const [left, setLeft] = useState<number>(0)
  const [localWidth, setLocalWidth] = useState<number>(0)
  const [isMouseOver, setIsMouseOver] = useState<boolean>(false)

  useEffect(() => {
    if (cardRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-shadow -- ignore
      const { left, width: localWidth } =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- ignore
        cardRef.current.getBoundingClientRect()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument --  ignore
      setLeft(left)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument --  ignore
      setLocalWidth(localWidth)
    }
  }, [])

  function mouseMoveHandler(event: any): void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- ignore
    event.preventDefault()

    const { clientX } = event
    if (cardRef.current) {
      const relativeX = clientX - left
      setWidthPercentage((relativeX / localWidth) * 100)
    }
  }

  function mouseLeaveHandler(): void {
    setIsMouseOver(false)
    setWidthPercentage(0)
  }
  function mouseEnterHandler(): void {
    setIsMouseOver(true)
  }

  const rotateDeg = (widthPercentage - 50) * 0.1
  return (
    <div
      className={cn(
        'relative w-[40rem] overflow-hidden rounded-lg border border-white/[0.08] bg-[#1d1c20] p-8',
        className
      )}
      onMouseEnter={mouseEnterHandler}
      onMouseLeave={mouseLeaveHandler}
      onMouseMove={mouseMoveHandler}
      ref={cardRef}
    >
      {children}

      <div className="relative  flex h-40 items-center overflow-hidden">
        <motion.div
          animate={
            isMouseOver
              ? {
                  opacity: widthPercentage > 0 ? 1 : 0,
                  clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`
                }
              : {
                  clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`
                }
          }
          className="absolute z-20 bg-[#1d1c20]  will-change-transform"
          style={{
            width: '100%'
          }}
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
        >
          <p
            className="bg-gradient-to-b from-white to-neutral-300 bg-clip-text py-10 text-base font-bold text-transparent text-white sm:text-[3rem]"
            style={{
              textShadow: '4px 4px 15px rgba(0,0,0,0.5)'
            }}
          >
            {revealText}
          </p>
        </motion.div>
        <motion.div
          animate={{
            left: `${widthPercentage}%`,
            rotate: `${rotateDeg}deg`,
            opacity: widthPercentage > 0 ? 1 : 0
          }}
          className="absolute z-50 h-40 w-[8px] bg-gradient-to-b from-transparent via-neutral-800 to-transparent will-change-transform"
          transition={isMouseOver ? { duration: 0 } : { duration: 0.4 }}
        />

        <div className=" overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]">
          <p className="bg-[#323238] bg-clip-text py-10 text-base font-bold text-transparent sm:text-[3rem]">
            {text}
          </p>
          <MemoizedStars />
        </div>
      </div>
    </div>
  )
}

export function TextRevealCardTitle({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <h2 className={twMerge('mb-2 text-lg text-white', className)}>
      {children}
    </h2>
  )
}

export function TextRevealCardDescription({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}): React.JSX.Element {
  return (
    <p className={twMerge('text-sm text-[#a9a9a9]', className)}>{children}</p>
  )
}

function Stars(): React.JSX.Element {
  const randomMove = (): number => Math.random() * 4 - 2
  const randomOpacity = (): number => Math.random()
  const random = (): number => Math.random()
  return (
    <div className="absolute inset-0">
      {[...Array(140)].map((_, i) => (
        <motion.span
          animate={{
            top: `calc(${random() * 100}% + ${randomMove()}px)`,
            left: `calc(${random() * 100}% + ${randomMove()}px)`,
            opacity: randomOpacity(),
            scale: [1, 1.2, 0]
          }}
          className="inline-block"
          // eslint-disable-next-line react/no-array-index-key -- ignore
          key={`star-${i}`}
          style={{
            position: 'absolute',
            top: `${random() * 100}%`,
            left: `${random() * 100}%`,
            width: `2px`,
            height: `2px`,
            backgroundColor: 'white',
            borderRadius: '50%',
            zIndex: 1
          }}
          transition={{
            duration: random() * 10 + 20,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      ))}
    </div>
  )
}

export const MemoizedStars = memo(Stars)
