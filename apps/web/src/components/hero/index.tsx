import { GeistSans } from 'geist/font/sans'
import Image from 'next/image'
import { ColorBGSVG, HeroImage } from '@public/hero'
import EncryptButton from '../ui/encrypt-btn'
import { InputBorderSpotlight } from '../ui/input-spotlight'

function Hero(): React.JSX.Element {
  return (
    <div className="relative mt-[10rem] flex h-screen flex-col items-center justify-center">
      <ColorBGSVG className="absolute -z-10 -translate-y-[6vw]" />
      <section className="flex flex-col items-center gap-8 py-[6.88rem]">
        <h1
          className={`${GeistSans.className} text-brandBlue text-6xl font-extralight`}
          style={{ textShadow: '0px 4px 4px rgba(202, 236, 241, 0.25)' }}
        >
          Unleash <span className="font-semibold">Security</span>, Embrace
          <span className="font-semibold"> Simplicity</span>
        </h1>
        <span className="text-brandBlue/80 flex w-[35rem] text-center text-xl leading-[3rem]">
          Your Go-To, Secure, and Easy-to-Use Secret Management Tool for the
          Developers, and by the Developers.
        </span>

        <div className="flex items-center gap-x-[1rem]">
          {/* <input
            className="bg-transparent bg-gradient-to-b from-[#E2E8FF]/[0%] to-[#E2E8FF]/[6%] border border-brandBlue/[42%] rounded-full placeholder:text-[#E2E8FF]/[35%] py-3 px-[0.94rem] w-[17.375rem]"
            placeholder="Email address..."
            type="email"
          /> */}
          <InputBorderSpotlight />
          <div className="border-brandBlue/[8%] rounded-full border p-[0.31rem] ">
            <EncryptButton TARGET_TEXT="Join Waitlist" />
          </div>
        </div>
      </section>
      <Image
        alt="hero image"
        className="mt-[3rem]"
        placeholder="blur"
        src={HeroImage}
      />
    </div>
  )
}

export default Hero
