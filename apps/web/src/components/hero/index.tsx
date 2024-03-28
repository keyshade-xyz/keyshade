"use client";
import { GeistSans } from 'geist/font/sans'
import Image from 'next/image'
import { ColorBGSVG, HeroImage } from '@public/hero'
import mixpanel from 'mixpanel-browser'
import { useEffect } from 'react'
import EncryptButton from '../ui/encrypt-btn'
import { InputBorderSpotlight } from '../ui/input-spotlight'

function Hero(): React.JSX.Element {
    useEffect(() => {
      mixpanel.track('Page View', {
        'Page Type': 'Home Page'
      })
    }, [])
  return (
    <div className="relative flex h-screen flex-col items-center justify-center md:mt-[10rem]">
      <ColorBGSVG className="absolute -z-10 -translate-y-[6vw]" />
      <section className="flex flex-col items-center gap-8 py-[6.88rem]">
        <h1
          className={`${GeistSans.className} text-brandBlue w-[25rem] text-center text-4xl font-extralight md:w-auto md:text-6xl`}
          style={{ textShadow: '0px 4px 4px rgba(202, 236, 241, 0.25)' }}
        >
          Unleash <span className="font-semibold">Security</span>, Embrace
          <span className="font-semibold"> Simplicity</span>
        </h1>
        <span className="text-brandBlue/80 flex w-[20rem] text-center text-sm md:w-[35rem] md:text-xl md:leading-[3rem]">
          Your Go-To, Secure, and Easy-to-Use Configuration Management Tool for
          the Developers, and by the Developers.
        </span>

        <div className="flex flex-col items-center gap-[1rem] md:flex-row">
          <InputBorderSpotlight />
          <div className="border-brandBlue/[8%] rounded-full border p-[0.31rem] ">
            <EncryptButton TARGET_TEXT="Join Waitlist" />
          </div>
        </div>
      </section>
      <Image
        alt="hero image"
        className="mt-[3rem] p-2"
        placeholder="blur"
        src={HeroImage}
      />
    </div>
  )
}

export default Hero
