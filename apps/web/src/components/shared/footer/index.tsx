import React from 'react'
import Link from 'next/link'
import { FooterLogoSVG } from '@public/shared'
import { SparklesCore } from '@/components/ui/sparkles'
import EncryptText from '@/components/ui/encrypt-text'
// import EncryptButton from '@/components/ui/encrypt-btn'

function Footer(): React.JSX.Element {
  return (
    <footer className="my-[10vw] flex w-full flex-col items-center">
      <div className="flex w-full items-center justify-center">
        <div className="relative h-20 w-[80%]">
          <div className="absolute inset-x-20 top-0 h-[2px] w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-sm" />
          <div className="absolute inset-x-20 top-0 h-px w-3/4 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
          <div className="absolute inset-x-60 top-0 h-[5px] w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent blur-sm" />
          <div className="absolute inset-x-60 top-0 h-px w-1/4 bg-gradient-to-r from-transparent via-sky-500 to-transparent" />
          <SparklesCore
            background="transparent"
            className="h-full w-full"
            maxSize={1}
            minSize={0.4}
            particleColor="#FFFFFF"
            particleDensity={1200}
          />
          <div className="absolute inset-0 h-full w-full bg-[#04050A] [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
        </div>
      </div>

      <div className="mt-5 w-[60%] justify-between md:flex">
        {/* <div className='pr-[2vw]'> */}
        <FooterLogoSVG />
        {/* </div> */}

        {/* <EncryptButton TARGET_TEXT="email us" /> */}
        <div className="gap-x-9 md:flex">
          <div>
            <span className="text-lg font-medium uppercase text-white/40">
              Resources
            </span>
            <ul className="mt-3 flex flex-col gap-y-3">
              <a
                href="https://docs.keyshade.xyz/"
                rel="noreferrer"
                target="_blank"
              >
                <EncryptText TARGET_TEXT="Docs" />
              </a>
              <li className="text-white/60 transition-colors hover:text-white">
                <EncryptText TARGET_TEXT="Blog" />
              </li>
            </ul>
          </div>
          <div>
            <span className="text-lg font-medium uppercase text-white/40">
              products
            </span>
            <ul className="mt-3 flex flex-col gap-y-3">
              <li className="text-white/60 transition-colors hover:text-white">
                <EncryptText TARGET_TEXT="CLI" />
              </li>
              <li className="text-white/60 transition-colors hover:text-white">
                <EncryptText TARGET_TEXT="SMK" />
              </li>
              <li className="text-white/60 transition-colors hover:text-white">
                <EncryptText TARGET_TEXT="Secret Scanner" />
              </li>
            </ul>
          </div>
          <div>
            <span className="text-lg font-medium uppercase text-white/40">
              company
            </span>
            <ul className="mt-3 flex flex-col gap-y-3">
              <li className="text-white/60 transition-colors hover:text-white">
                <Link href="/about">
                  <EncryptText TARGET_TEXT="About" />
                </Link>
              </li>
              <li className="text-white/60 transition-colors hover:text-white">
                <Link href="/career">
                  <EncryptText TARGET_TEXT="Career" />
                </Link>
              </li>
              <li className="text-white/60 transition-colors hover:text-white">
                <EncryptText TARGET_TEXT="Contact" />
              </li>
            </ul>
          </div>
          <div>
            <span className="text-lg font-medium uppercase text-white/40">
              legal
            </span>
            <ul className="mt-3 flex flex-col gap-y-3">
              <Link
                className="text-white/60 transition-colors hover:text-white"
                href="/terms_and_condition"
              >
                <EncryptText TARGET_TEXT="Terms and Conditions" />
              </Link>
              <Link
                className="text-white/60 transition-colors hover:text-white"
                href="/privacy"
              >
                <EncryptText TARGET_TEXT="Privacy Policy" />
              </Link>
            </ul>
          </div>
          <div>
            <span className="text-lg font-medium uppercase text-white/40">
              Socials
            </span>
            <ul className="mt-3 flex flex-col gap-y-3">
              <a
                className="text-white/60 transition-colors hover:text-white"
                href="https://twitter.com/keyshade_xyz"
                rel="noreferrer"
                target="_blank"
              >
                <EncryptText TARGET_TEXT="Twitter" />
              </a>
              <a
                className="text-white/60 transition-colors hover:text-white"
                href="https://linkedin.com/company/keyshade-xyz/"
                rel="noreferrer"
                target="_blank"
              >
                <EncryptText TARGET_TEXT="LinkedIn" />
              </a>
              <a
                className="text-white/60 transition-colors hover:text-white"
                href="https://discord.gg/mV9PsXsjaH"
                rel="noreferrer"
                target="_blank"
              >
                <EncryptText TARGET_TEXT="Discord" />
              </a>
              <a
                className="text-white/60 transition-colors hover:text-white"
                href="https://github.com/keyshade-xyz/keyshade"
                rel="noreferrer"
                target="_blank"
              >
                <EncryptText TARGET_TEXT="GitHub" />
              </a>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
