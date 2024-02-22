import Image from 'next/image'
import { Inter } from 'next/font/google'
import React from 'react'

const inter = Inter({ subsets: ['latin'] })

interface KillersProps {
  image: string
  twitterUserName: string
}
function Killers({ image, twitterUserName }: KillersProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-cente gap-2">
      <div className="flex justify-center items-center h-[48px] w-[48px] rounded-full border-[#3a3e41] border-solid border-[2px] bg-gradient-to-br from-[#181c20] to-[#282d31]">
        <Image
          alt={image}
          className="unselectable"
          draggable="false"
          height={36}
          src={`/./${image}.png`}
          width={37}
        />
      </div>
      <div
        className={`flex flex-col justify-center items-center gap-1 ${inter.className}`}
      >
        <p className="text-white text-sm">{image}</p>
        <a
          href={`https://twitter.com/${twitterUserName}`}
          rel="noopener"
          target="_blank"
        >
          <p className="text-[#727576] text-xs">@{twitterUserName}</p>
        </a>
      </div>
    </div>
  )
}

export default Killers
