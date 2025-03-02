import { CheckmarkSVG, CopySVG } from '@public/svg/shared'
// eslint-disable-next-line camelcase -- we need to import the font
import { Roboto_Mono } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const roboto = Roboto_Mono({ weight: ['400'], subsets: ['latin'] })

interface SlugProps {
  text: string
}

export default function Slug({ text }: SlugProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const hasOverflow =
          textRef.current.scrollWidth > textRef.current.clientWidth
        setIsOverflowing(hasOverflow)
      }
    }

    checkOverflow()
    // Add resize listener to check overflow on window resize
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [text])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)

    toast.success('Copied to clipboard!', {
      description: (
        <p className="text-xs text-green-300">
          The slug got copied to your clipboard.
        </p>
      )
    })

    setTimeout(() => setCopied(false), 4500)
  }

  return (
    <button
      className={`${roboto.className} group flex cursor-copy gap-2 whitespace-nowrap rounded-lg bg-white/10 px-3 py-2 font-mono text-sm text-white/50 hover:bg-white/15`}
      onClick={copyToClipboard}
      type="button"
    >
      <div className="overflow-hidden">
        <p
          className={`${isOverflowing ? 'group-hover:animate-marquee' : ''} w-full`}
          ref={textRef}
        >
          {text}
        </p>
      </div>{' '}
      <div className="flex-shrink-0">
        {copied ? (
          <CheckmarkSVG className="h-[20px] w-[20px]" />
        ) : (
          <CopySVG className="h-[20px] w-[20px]" />
        )}
      </div>
    </button>
  )
}
