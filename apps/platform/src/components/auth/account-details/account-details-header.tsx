import { KeyshadeBigSVG } from '@public/svg/auth'
import React from 'react'
import { GeistSansFont } from '@/fonts'

export default function AccountDetailsHeader() {
  return (
    <div className="mb-12 flex flex-col items-center">
      <KeyshadeBigSVG />
      <h1 className={`${GeistSansFont.className} text-[2.5rem] font-semibold`}>
        Almost Done
      </h1>
      <div className="flex w-[15rem] flex-col items-center text-center">
        <span className={GeistSansFont.className}>
          Fill up the rest details and start your way to security
        </span>
      </div>
    </div>
  )
}
