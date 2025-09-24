'use client'
import Image from 'next/image'
import { Toaster } from 'sonner'
import { HeroImage } from '@public/hero'
import EncryptButton from '../ui/encrypt-btn'
import { isUserLoggedIn } from '@/utils/is-user-logged-in'

function Hero(): React.JSX.Element {
  return (
    <>
      <Toaster />
      <div className="relative -top-8 flex min-h-screen w-full flex-col items-center justify-center  bg-[url(/hero/colour-bg.svg)]  bg-cover bg-no-repeat pb-4 md:pt-[10rem]">
        <section className="flex flex-col items-center gap-8 py-[6.88rem] ">
          <h1
            className={` text-brandBlue w-[25rem] text-center text-4xl md:w-auto md:text-7xl`}
            style={{ textShadow: '0px 4px 4px rgba(202, 236, 241, 0.25)' }}
          >
            The better .env file replacement
          </h1>
          <span className="text-brandBlue/80 flex w-[20rem] flex-col justify-center text-center text-sm md:w-[35rem] md:text-xl md:leading-[2rem]">
            <p>Stop DMing your Environment variables</p>
            <p>And start syncing them securely & instantly </p>
          </span>
          <a href="https://app.keyshade.xyz" rel="noreferrer" target="_blank">
            <div className="border-brandBlue/[8%] rounded-full border p-[0.31rem] ">
              <EncryptButton
                TARGET_TEXT={
                  isUserLoggedIn() ? 'Open app' : 'Try Keyshade for Free'
                }
              />
            </div>
            <p className="mt-2 text-center text-sm text-white/30">
              Currently in alpha
            </p>
          </a>
        </section>
        <Image
          alt="hero image"
          className="mt-[3rem] p-2"
          placeholder="blur"
          src={HeroImage}
        />
      </div>
    </>
  )
}

export default Hero
