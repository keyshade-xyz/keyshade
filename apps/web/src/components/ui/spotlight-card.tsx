'use client'
import React, { useRef, useState } from 'react'

function SpotlightCard({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const divRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (!divRef.current || isFocused) return

    const div = divRef.current
    const rect = div.getBoundingClientRect()

    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const handleFocus = (): void => {
    setIsFocused(true)
    setOpacity(1)
  }

  const handleBlur = (): void => {
    setIsFocused(false)
    setOpacity(0)
  }

  const handleMouseEnter = (): void => {
    setOpacity(1)
  }

  const handleMouseLeave = (): void => {
    setOpacity(0)
  }

  return (
    <div
      className="relative h-full w-full"
      onBlur={handleBlur}
      onFocus={handleFocus}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      ref={divRef}
    >
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(202, 236, 241, .15), transparent 40%)`
        }}
      />
      {children}
    </div>
  )
}

export default SpotlightCard
