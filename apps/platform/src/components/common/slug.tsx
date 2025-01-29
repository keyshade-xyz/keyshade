// eslint-disable-next-line camelcase -- this is a font import
import { Roboto_Mono } from 'next/font/google'
import { toast } from 'sonner'

const roboto = Roboto_Mono({ weight: ['400'], subsets: ['latin'] })

interface SlugProps {
  text: string
}

export default function Slug({ text }: SlugProps): React.JSX.Element {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard!', {
      description: (
        <p className="text-xs text-green-300">
          The slug got copied to your clipboard.
        </p>
      )
    })
  }

  return (
    <button
      className={`${roboto.className} rounded-lg bg-white/[10%] px-3 py-2 font-mono text-sm text-white/50`}
      onClick={copyToClipboard}
      type="button"
    >
      {text}
    </button>
  )
}
