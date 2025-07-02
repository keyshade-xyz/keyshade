// eslint-disable-next-line camelcase -- we need to import the font
import { Roboto_Mono } from 'next/font/google'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CheckmarkSVG, CopySVG } from '@public/svg/shared'

const roboto = Roboto_Mono({ weight: ['400'], subsets: ['latin'] })

interface SlugProps {
  text: string
}

export default function CopySlug({ text }: SlugProps): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const textWidth = textRef.current.scrollWidth
        const containerWidth = containerRef.current.clientWidth
        setIsOverflowing(textWidth > containerWidth)
      }
    }

    const timeoutId = setTimeout(checkOverflow, 10)

    const handleResize = () => {
      setTimeout(checkOverflow, 10)
    }

    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', handleResize)
    }
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
      className={`${roboto.className} group flex min-w-fit max-w-80 cursor-copy items-center gap-2 rounded-lg bg-white/40 px-3 py-2 font-mono text-sm text-white hover:bg-white/15`}
      onClick={copyToClipboard}
      type="button"
    >
      <div className="min-w-0 flex-1 overflow-hidden" ref={containerRef}>
        <p
          className={`${isOverflowing ? 'group-hover:animate-marquee' : ''} whitespace-nowrap text-xs`}
          ref={textRef}
        >
          {text}
        </p>
      </div>
      <div className="flex-shrink-0">
        {copied ? (
          <CheckmarkSVG className="h-[16px] w-[16px]" />
        ) : (
          <CopySVG className="h-[16px] w-[16px]" />
        )}
      </div>
    </button>
  )
}
