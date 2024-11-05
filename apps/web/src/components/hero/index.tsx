'use client'
// import { GeistSans } from 'geist/font/sans'
import Image from 'next/image'
import { useState } from 'react'
import { Toaster, toast } from 'sonner'
import { z } from 'zod'
import { ColorBGSVG, HeroImage } from '@public/hero'
import EncryptButton from '../ui/encrypt-btn'
import { InputBorderSpotlight } from '../ui/input-spotlight'

const emailSchema = z.string().email()

function Hero(): React.JSX.Element {
  const [email, setEmail] = useState<string>('')

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault()

    const result = emailSchema.safeParse(email)

    if (!result.success) {
      toast.custom(() => (
        <div className="text-brandBlue border-brandBlue/20 w-[90vw] rounded-lg border bg-errorRed p-2 shadow-2xl backdrop-blur-3xl md:w-[20vw]">
          <p className="text-sm">Please enter a valid email address </p>
        </div>
      ))
      return
    }

    const dataInStorage: string | null = localStorage.getItem('waitlistData')
    const emailsInWaitlist: string[] = dataInStorage ? (JSON.parse(dataInStorage) as string[]) : []
  
    // actual logic where we are checking if this email is already in waitlisted users or not
    if (emailsInWaitlist.includes(email)) {
      toast.custom(() => (
        <div className="text-brandBlue border-brandBlue/20 w-[90vw] rounded-lg border bg-errorRed p-2 shadow-2xl backdrop-blur-3xl md:w-[20vw]">
          <p className="text-sm">
            You have been already added to the waitlist. We will notify you once
            we launch.
          </p>
        </div>
      ))
      return
    }

    const url =
      'https://xyz.us18.list-manage.com/subscribe/post?u=2e44b940cafe6e54d8b9e0790&amp;id=bd382dd7c5&amp;f_id=00e5c2e1f0'

    async function fetchData(): Promise<void> {
      try {
        await fetch(`${url}&EMAIL=${email}`, {
          mode: 'no-cors'
        })

        toast.custom((_t) => (
          <div className="text-brandBlue border-brandBlue/20 w-[90vw] rounded-lg border bg-[#293234] p-2 shadow-2xl backdrop-blur-3xl md:w-[25vw]">
            <h1 className="font-semibold">Welcome to Keyshade 🎉</h1>
            <p className="text-sm">
              You have been added to the waitlist. We will notify you once we
              launch
            </p>
          </div>

        ))    

        emailsInWaitlist.push(email)
        localStorage.setItem('waitlistData', JSON.stringify(emailsInWaitlist))
        setEmail('')

      } catch (error) {
        // eslint-disable-next-line no-console -- chill
        console.error(error)
      }
    }
    void fetchData()
  }

  return (
    <>
      <Toaster />
      <div className="relative flex h-screen flex-col items-center justify-center md:mt-[10rem]">
        <ColorBGSVG className="absolute -z-10 -translate-y-[12rem]" />
        <section className="flex flex-col items-center gap-8 py-[6.88rem]">
          <h1
            className={` text-brandBlue w-[25rem] text-center text-4xl font-extralight md:w-auto md:text-6xl`}
            style={{ textShadow: '0px 4px 4px rgba(202, 236, 241, 0.25)' }}
          >
            Unleash <span className="font-semibold">Security</span>, Embrace
            <span className="font-semibold"> Simplicity</span>
          </h1>
          <span className="text-brandBlue/80 flex w-[20rem] text-center text-sm md:w-[35rem] md:text-xl md:leading-[3rem]">
            Your Go-To, Secure, and Easy-to-Use Configuration Management Tool
            for the Developers, and by the Developers.
          </span>

          <form onSubmit={onSubmit}>
            <div className="flex flex-col items-center gap-[1rem] md:flex-row">
              <InputBorderSpotlight setEmail={setEmail} />
              <div className="border-brandBlue/[8%] rounded-full border p-[0.31rem] ">
                <EncryptButton
                  TARGET_TEXT="Join Waitlist"
                  onClick={() => onSubmit}
                />
              </div>
            </div>
          </form>
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
