import { CopySVG } from '@public/svg/shared'
// eslint-disable-next-line camelcase -- we need to import the font
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
      className={`${roboto.className} flex cursor-copy gap-2 rounded-lg whitespace-nowrap bg-white/10 px-3 py-2 font-mono text-sm text-white/50 hover:bg-white/15`}
      onClick={copyToClipboard}
      type="button"
    >
      {text} <CopySVG className="w-[20px]" />
    </button>
  )
}