import { KeyshadeBigSVG } from '@public/svg/auth'
import { GeistSans } from 'geist/font/sans'
import React from 'react'

interface AuthHeaderProps {
  reason: string | null
}

export default function AuthHeader({
  reason
}: AuthHeaderProps): React.JSX.Element {
  return (
    <div className={`${reason ? 'mb-4' : 'mb-14'} flex flex-col items-center`}>
      <KeyshadeBigSVG />
      <h1
        className={`${GeistSans.className} text-[2rem] font-semibold md:text-[2.5rem]`}
      >
        Welcome to Keyshade
      </h1>
    </div>
  )
}
