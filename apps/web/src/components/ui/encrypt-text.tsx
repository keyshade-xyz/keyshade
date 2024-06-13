'use client'
import React, { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

function EncryptText({
  TARGET_TEXT
}: {
  TARGET_TEXT: string
}): React.JSX.Element {
  // const TARGET_TEXT = 'Join Waitlist'
  const CYCLES_PER_LETTER = 2
  const SHUFFLE_TIME = 50
  const CHARS = '!@#$%^&*():{};|,.<>/?'

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [text, setText] = useState(TARGET_TEXT)
  const [width, setWidth] = useState<number | null>(null)
  const textRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (textRef.current) {
      setWidth(textRef.current.offsetWidth)
    }
  }, [TARGET_TEXT])

  const scramble = (): void => {
    let pos = 0

    intervalRef.current = setInterval(() => {
      const scrambled = TARGET_TEXT.split('')
        .map((char, index) => {
          if (pos / CYCLES_PER_LETTER > index) {
            return char
          }

          const randomCharIndex = Math.floor(Math.random() * CHARS.length)
          const randomChar = CHARS[randomCharIndex]

          return randomChar
        })
        .join('')

      setText(scrambled)
      pos++

      if (pos >= TARGET_TEXT.length * CYCLES_PER_LETTER) {
        stopScramble()
      }
    }, SHUFFLE_TIME)
  }

  const stopScramble = (): void => {
    clearInterval(intervalRef.current || undefined)
    setText(TARGET_TEXT)
  }

  return (
    <motion.div
      className="group relative w-full overflow-hidden text-white/60 transition-colors hover:text-white"
      onMouseEnter={scramble}
      onMouseLeave={stopScramble}
      style={{ width: width ? `${width}px` : 'auto' }}
    >
      <span className="invisible absolute" ref={textRef}>
        {TARGET_TEXT}
      </span>
      <motion.button
        className="relative z-10 flex items-center gap-2"
        role="link"
      >
        <span className="flex whitespace-nowrap">{text}</span>
      </motion.button>
    </motion.div>
  )
}

export default EncryptText
