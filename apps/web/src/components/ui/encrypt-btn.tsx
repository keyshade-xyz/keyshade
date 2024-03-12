'use client'
import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface EncryptButtonProps extends React.HTMLProps<HTMLButtonElement> {
  TARGET_TEXT: string
}

function EncryptButton({ TARGET_TEXT }: EncryptButtonProps): React.JSX.Element {
  // const TARGET_TEXT = 'Join Waitlist'
  const CYCLES_PER_LETTER = 2
  const SHUFFLE_TIME = 50

  const CHARS = '!@#$%^&*():{};|,.<>/?'

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [text, setText] = useState(TARGET_TEXT)

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
    <motion.button
      className="bg-brandBlue/[12%] backdrop-blur hover:text-brandBlue group relative overflow-hidden rounded-full px-4 py-2 font-mono font-medium uppercase text-neutral-300 transition-colors"
      onMouseEnter={scramble}
      onMouseLeave={stopScramble}
      type="submit"
      whileHover={{
        scale: 1.025
      }}
      whileTap={{
        scale: 0.975
      }}
    >
      <div className="relative z-10 flex items-center gap-2">
        <span className="flex">
          {text}{' '}
          <svg
            fill="none"
            height="21"
            viewBox="0 0 21 21"
            width="21"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M9.11719 13.9235L12.1559 10.8848C12.3186 10.7221 12.3186 10.4583 12.1559 10.2955L9.11719 7.25684"
              stroke="#CAECF1"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </span>
      </div>
      <motion.span
        animate={{
          y: '-100%'
        }}
        className="from-brandBlue/0 via-brandBlue/100 to-brandBlue/0 absolute inset-0 z-0 scale-125 bg-gradient-to-t from-40% to-60% opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        initial={{
          y: '100%'
        }}
        transition={{
          repeat: Infinity,
          repeatType: 'mirror',
          duration: 1,
          ease: 'linear'
        }}
      />
    </motion.button>
  )
}

export default EncryptButton
