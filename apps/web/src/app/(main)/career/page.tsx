import React from 'react'
import { ColorBGSVG } from '@public/hero'
import EncryptButton from '@/components/ui/encrypt-btn'

function Career(): React.JSX.Element {
  return (
    <div className="relative flex h-[50vh] flex-col items-center justify-center ">
      <ColorBGSVG className="absolute -z-10 -translate-y-[6vw]" />
      <div className="flex flex-col gap-y-6">
        <h1 className="text-brandBlue text-4xl">Careers at KeyShade</h1>
        <p className="w-[80%]">
          We are booting up, keep an eye out for open positions. Meanwhile, you
          can contribute to our project.
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
