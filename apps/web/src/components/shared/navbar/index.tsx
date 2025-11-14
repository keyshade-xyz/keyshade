'use client'
import Link from 'next/link'
import { ArrowRight, Logo } from '@public/shared'
import { GithubSVG } from '@public/navbar'
import { Geist } from 'next/font/google'
import { useState } from 'react'
import { isUserLoggedIn } from '@/utils/is-user-logged-in'
import CtaButton from '@/components/CtaButton'
import TertiaryButton from '@/components/TertiaryButton'

const geist = Geist({
  subsets: ['latin']
})

function Navbar(): React.JSX.Element {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navContent: { name: string; href: string }[] = [
    {
      name: 'Docs',
      href: 'https://docs.keyshade.io/'
    },
    {
      name: 'About',
      href: '/about'
    },
    {
      name: 'Pricing',
      href: '/pricing'
    },
    {
      name: 'Blog',
      href: 'https://blog.keyshade.io/'
    }
  ]

  return (
    <>
      <div className="mx-5 my-4 flex w-full max-w-[82rem] items-center justify-between md:mx-12">
        <Link href="/">
          <Logo className="w-[270px]" />
        </Link>

        {/* Desktop Navigation */}
        <div className={`hidden md:flex ${geist.className}`}>
          {navContent.map((item) => {
            return (
              <Link className="px-4 py-2" href={item.href} key={item.name}>
                {item.name}
              </Link>
            )
          })}
        </div>

        {/* Desktop Buttons */}
        <div className="hidden items-center gap-4 md:flex">
          <a
            href="https://github.com/keyshade-xyz/keyshade"
            rel="noopener noreferrer"
            target="_blank"
          >
            <TertiaryButton>
              <GithubSVG height={24} width={26} /> Github
            </TertiaryButton>
          </a>
          <a
            href="https://app.keyshade.io"
            rel="noopener noreferrer"
            target="_blank"
          >
            <CtaButton>
              {isUserLoggedIn() ? (
                <span>Open App</span>
              ) : (
                <span>Get Started</span>
              )}{' '}
              <ArrowRight />
            </CtaButton>
          </a>
        </div>

        {/* Hamburger Menu Button */}
        <button
          className="flex flex-col gap-1 md:hidden"
          onClick={() => { setIsMenuOpen(!isMenuOpen); }}
          type="button"
        >
          <div
            className={`h-0.5 w-6 bg-white transition-all ${isMenuOpen ? 'translate-y-1.5 rotate-45' : ''}`}
          />
          <div
            className={`h-0.5 w-6 bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`}
          />
          <div
            className={`h-0.5 w-6 bg-white transition-all ${isMenuOpen ? '-translate-y-1.5 -rotate-45' : ''}`}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen ? <div className="absolute left-0 top-full z-50 w-full bg-black/90 backdrop-blur-sm md:hidden">
          <div className={`flex flex-col p-4 ${geist.className}`}>
            {navContent.map((item) => {
              return (
                <Link
                  className="border-b border-gray-700 px-4 py-3 text-white"
                  href={item.href}
                  key={item.name}
                  onClick={() => { setIsMenuOpen(false); }}
                >
                  {item.name}
                </Link>
              )
            })}
            <div className="mt-4 flex flex-row items-center gap-3 md:flex-col">
              <a
                href="https://github.com/keyshade-xyz/keyshade"
                onClick={() => { setIsMenuOpen(false); }}
                rel="noopener noreferrer"
                target="_blank"
              >
                <TertiaryButton>
                  <GithubSVG height={24} width={26} /> Github
                </TertiaryButton>
              </a>
              <a
                href="https://app.keyshade.io"
                onClick={() => { setIsMenuOpen(false); }}
                rel="noopener noreferrer"
                target="_blank"
              >
                <CtaButton>
                  {isUserLoggedIn() ? (
                    <span>Open App</span>
                  ) : (
                    <span>Get Started</span>
                  )}{' '}
                  <ArrowRight />
                </CtaButton>
              </a>
            </div>
          </div>
        </div> : null}
    </>
  )
}

export default Navbar
