import { ColorBGSVG } from '@public/hero'
import Link from 'next/link'
import EncryptButton from '@/components/ui/encrypt-btn'

function Career(): React.JSX.Element {
  return (
    <div className="relative flex h-[50vh] flex-col items-center justify-center ">
      <ColorBGSVG className="absolute -z-10 -translate-y-[6vw]" />
      <div className="flex flex-col gap-y-6">
        <h1 className="text-brandBlue text-4xl">Careers at KeyShade</h1>
        <p className="w-[80%]">
          We are booting up, keep an eye out for open positions on our{' '}
          <Link
            className="text-brandBlue"
            href="https://keyshade.notion.site/Careers-at-Keyshade-86121f04ea974b7a9ece1a9969335ad0"
          >
            Notion board
          </Link>
          . Meanwhile, you can contribute to our project.
        </p>
        <div className="flex">
          <a
            href="https://github.com/keyshade-xyz/keyshade"
            rel="noopener noreferrer"
            target="_blank"
          >
            <div className="border-brandBlue/[8%] rounded-full border p-[0.31rem] ">
              <EncryptButton TARGET_TEXT="Contribute" />
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default Career
