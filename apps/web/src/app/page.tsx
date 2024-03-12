'use client'

import { Poppins } from 'next/font/google'
import { useState } from 'react'
// eslint-disable-next-line import/no-extraneous-dependencies -- chill
import { Toaster, toast } from 'sonner'
import Links from '../components/links'
import Killers from '../components/killers'
import { Logo, Grid, Stars, DiscordSVG, XSVG, LinkdinSVG } from '../../public'
import { InputBorderSpotlight } from '@/components/ui/input-spotlight'
import EncryptButton from '@/components/ui/encrypt-btn'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700']
})

function Index(): React.JSX.Element {
  const [email, setEmail] = useState<string>('')

  // eslint-disable-next-line no-console -- chill
  console.log(email)

  const onSubmit = (e: React.FormEvent): void => {
    e.preventDefault()

    if (email === '') {
      toast.custom(() => (
        <div className="bg-[#852b2c] shadow-2xl p-2 backdrop-blur-3xl rounded-lg text-brandBlue w-[90vw] md:w-[20vw] border border-brandBlue/20">
          <p className="text-sm">Pleasse enter an email address </p>
        </div>
      ))
      return
    }

    const url =
      'https://xyz.us18.list-manage.com/subscribe/post?u=2e44b940cafe6e54d8b9e0790&amp;id=bd382dd7c5&amp;f_id=00e5c2e1f0'

    async function fetchData(): Promise<void> {
      toast.custom((_t) => (
        <div className="bg-[#293234] shadow-2xl p-2 backdrop-blur-3xl rounded-lg text-brandBlue w-[90vw] md:w-[25vw] border border-brandBlue/20">
          <h1 className="font-semibold">Welcome to Keyshade 🎉</h1>
          <p className="text-sm">
            You have been added to the waitlist. We will notify you once we
            launch
          </p>
          {/* <button onClick={() => toast.dismiss(t)} type='button'>Dismiss</button> */}
        </div>
      ))
      try {
        await fetch(`${url}&EMAIL=${email}`, {
          mode: 'no-cors'
        })
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
      <div className="relative">
        <div className="absolute z-10 opacity-25">
          <section className="h-[100vh] w-screen bg-[radial-gradient(ellipse_at_top_center,_#fff_20%,#ff03080B_80%)] opacity-50" />
        </div>
        <div className=" w-full min-h-screen flex justify-center items-center absolute px-5 md:px-0">
          <Grid className="h-[69.16vh] w-[61.23vw] absolute " />
          <Stars className="h-[47.51vh] w-[87.92vw] absolute overflow-hidden" />
          <div className="bg-transparent  w-fit h-[75%] flex flex-col p-1  gap-10 z-20 md:mt-20">
            <div className="flex flex-col items-center justify-center gap-8 min-w-screen">
              <div className="flex items-center justify-center w-full">
                <Logo />
                <h1
                  className={`px-4 bg-gradient-to-br from-[#727576] to-[#fafafb] inline-block text-transparent bg-clip-text ${poppins.className} py-1 text-4xl md:text-6xl`}
                >
                  keyshade.xyz
                </h1>
              </div>
              <div className="flex items-center justify-center py-10">
                <p className="min-w-[55%] sm:w-full md:w-[50%] lg:w-[35%] items-center justify-center bg-gradient-to-br from-[#727576] to-[#fafafb] inline-block text-transparent bg-clip-text text-wrap  text-center text-md md:p-1">
                  Manage all your secrets securely with public key encryption
                  and realtime based tools, that seamlessly fits into your
                  codebase
                </p>
              </div>

              <div className="flex gap-4 items-center justify-center md:gap-10">
                <Links
                  description="Documentation"
                  icon="docs"
                  link="https://docs.keyshade.xyz/"
                />
                <Links
                  description="Star on Github"
                  icon="github"
                  link="https://github.com/keyshade-xyz/keyshade"
                />
              </div>
              <form onSubmit={onSubmit}>
                <div className="flex flex-col md:flex-row items-center gap-[1rem]">
                  <InputBorderSpotlight setEmail={setEmail} />
                  <div className="border-brandBlue/[8%] rounded-full border p-[0.31rem] ">
                    <EncryptButton
                      TARGET_TEXT="Join Waitlist"
                      onClick={() => onSubmit}
                    />
                  </div>
                </div>
              </form>

              <div className="flex items-center justify-center gap-8 mt-16 md:gap-24 md:mt-20">
                <a href="https://discord.gg/mV9PsXsjaH" rel="noopener referrer" target="_blank">
                  <Killers>
                  <DiscordSVG width={26} />
                </Killers>
                </a>
                
                <a href="https://twitter.com/keyshade_xyz" rel="noopener referrer" target="_blank">
                  <Killers>
                  <XSVG width={26} />
                </Killers>
                </a>
                
                <a href="https://www.linkedin.com/company/keyshade-xyz/" rel="noopener referrer" target="_blank">
                  <Killers>
                  <LinkdinSVG width={26} />
                </Killers>
                </a>
                
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Index
