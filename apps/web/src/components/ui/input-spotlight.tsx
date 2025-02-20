'use client'
import type { Dispatch, SetStateAction } from 'react'
import React, { useRef, useState } from 'react'

interface InputBorderSpotlightProps {
  setEmail: Dispatch<SetStateAction<string>>
  onSubmit: ( e: React.FormEvent) => void
}

export function InputBorderSpotlight({
  setEmail,
  onSubmit
}: InputBorderSpotlightProps): React.JSX.Element {
  const divRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLInputElement>): void => {
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
    <div className="relative w-80">
      <input
        autoCapitalize="off"
        autoComplete="off"
        className="border-brandBlue/[30%] focus:border-brandBlue h-10 w-full cursor-text rounded-full border bg-transparent bg-gradient-to-b from-[#E2E8FF]/[0%] to-[#E2E8FF]/[6%] p-3.5 px-[0.94rem] py-3  text-slate-100 backdrop-blur transition-colors  duration-500 placeholder:select-none placeholder:text-[#E2E8FF]/[50%] placeholder:text-neutral-500 focus:outline-none"
        id="mce-EMAIL"
        name="EMAIL"
        onBlur={handleBlur}
        onChange={(e) => setEmail(e.target.value)}
        onFocus={handleFocus}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        placeholder="Enter your email address"
        size={25}
        type="text"
      />
      <input
        aria-hidden="true"
        className="border-brandBlue pointer-events-none absolute left-0 top-0 z-10 h-10 w-full cursor-default rounded-full border bg-[transparent] p-3.5 opacity-0  transition-opacity duration-500 placeholder:select-none"
        disabled
        ref={divRef}
        style={{
          border: '1px solid rgba(202, 236, 241, 1)',
          opacity,
          WebkitMaskImage: `radial-gradient(30% 30px at ${position.x}px ${position.y}px, black 45%, transparent)`
        }}
      />
    </div>
  )
}
