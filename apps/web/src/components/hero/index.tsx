'use client'
import { Toaster } from 'sonner'
import { GithubSVG } from '@public/navbar'
import { BottomGradientSVG, HeroImage, VideoSVG } from '@public/hero'
import { ArrowRight } from '@public/shared'
import Image from 'next/image'
// eslint-disable-next-line camelcase -- IGNORE ---
import { Geist, Geist_Mono } from 'next/font/google'
import CtaButton from '../CtaButton'
import { isUserLoggedIn } from '@/utils/is-user-logged-in'

const geist = Geist({
  subsets: ['latin']
})
const geistMono = Geist_Mono({
  subsets: ['latin'],
  weight: ['400', '700']
})
function Hero(): React.JSX.Element {
  return (
    <>
      <Toaster />
      <div className=" mt-[4.5rem] flex w-full flex-col items-center justify-center">
        <div className="flex w-full flex-col items-center justify-center gap-3">
          <div
            className={`${geist.className} flex items-center gap-2 rounded-full border border-[#33E3FF] px-3 py-2 text-sm`}
          >
            <span className="font-medium text-[#C3E9EF]">Secured by</span>
            <div className="flex items-center gap-1">
              <GithubSVG height={16} width={16} />
              <span>Github Secure Open Source Fund</span>
            </div>
          </div>
          <h1
            className={`${geist.className} mt-4 w-[37.5rem] bg-gradient-to-b from-[#CFF8FF] to-[#E5EFFE] bg-clip-text text-center text-7xl font-semibold text-transparent`}
          >
            The smarter .env file replacement
          </h1>
          <p
            className={`${geist.className} w-[22.5rem] text-center text-base text-[#E9FCFFD6]`}
          >
            Stop DMing your Environment variables right now. And start syncing
            them securely & instantly
          </p>
        </div>
        <div className="mt-[2rem] flex items-center gap-3">
          <a
            href="https://cal.com/keyshade/demo"
            rel="noopener noreferrer"
            target="_blank"
          >
            <CtaButton>
              {' '}
              <VideoSVG /> Schedule a Demo
            </CtaButton>
          </a>
          <a
            href="https://app.keyshade.xyz"
            rel="noopener noreferrer"
            target="_blank"
          >
            <button
              className={`${geistMono.className} flex items-center gap-3 rounded-[8px] border border-[#33E3FF]/[60%] bg-[#99EEFF14] px-4 py-2 text-[#D4F7FF]`}
              type="button"
            >
              {isUserLoggedIn() ? 'Open app' : 'Sign in to Keyshade'}{' '}
              <ArrowRight />
            </button>
          </a>
        </div>
        <div className="-z-10 -mt-[7rem] flex flex-col items-center">
          <BottomGradientSVG />
          <Image
            alt="hero image"
            className="max-w-[82rem]"
            draggable={false}
            priority
            quality={100}
            src={HeroImage}
          />
        </div>
      </div>
    </>
  )
}

export default Hero
