import { KeyshadeBigSVG } from '@public/svg/auth'
import React from 'react'
import { GeistSansFont } from '@/fonts'

interface OtpHeaderProps {
  email: string
}

export default function OtpHeader({
  email
}: OtpHeaderProps): React.JSX.Element {
  return (
    <div className="mb-14 flex flex-col items-center">
      <KeyshadeBigSVG />
      <h1
        className={`${GeistSansFont.className} text-center text-[2rem] font-semibold md:text-[2.5rem]`}
      >
        Verify your mail address
      </h1>
      <div className={`${GeistSansFont.className} flex flex-col items-center`}>
        <span>We&apos;ve sent a verification code to </span>
        <span>{email}</span>
      </div>
    </div>
  )
}
