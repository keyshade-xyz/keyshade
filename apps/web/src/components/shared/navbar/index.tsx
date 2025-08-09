'use client'
import Link from 'next/link'
import { Logo, LogoM } from '@public/shared'
import { Button } from '@/components/ui/moving-border'
import { isUserLoggedIn } from '@/utils/is-user-logged-in'

function Navbar(): React.JSX.Element {
  return (
    <nav
      className="mx-10 mt-5 flex w-full items-center justify-between rounded-full border border-[#728689]/60 px-2 py-1 md:w-[79.625rem] md:px-[2.94rem]"
      style={{
        background:
          'linear-gradient(180deg, rgba(226, 232, 255, 0.15) 0%, rgba(226, 232, 255, 0.03) 100%)'
      }}
    >
      <Link href="/" tabIndex={-1}>
        <Logo className="hidden md:flex" />
        <LogoM className="flex md:hidden" />
      </Link>
      <ul className="hidden gap-x-4 text-white/60 md:flex">
        <li>
          <a
            href="https://docs.keyshade.xyz/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Docs
          </a>
        </li>
        <li>
          <Link href="/about">About</Link>
        </li>
        <li>
          <Link href="/pricing">Pricing</Link>
        </li>
        <li>
          <Link href="/share">Share</Link>
        </li>
        <li>
          <a
            href="https://blog.keyshade.xyz/"
            rel="noopener noreferrer"
            target="_blank"
          >
            Blog
          </a>
        </li>
      </ul>
      <div className="flex items-center gap-x-4">
        <a href="https://git.new/keyshade">
          <button
            className="hidden rounded-full border border-white/50 px-4 py-2 text-white/80 md:flex"
            type="button"
          >
            View GitHub
          </button>
        </a>
        <a
          href="https://app.keyshade.xyz"
          rel="noopener noreferrer"
          target="_blank"
        >
          <Button duration={6 * 1000}>
            {isUserLoggedIn() ? 'Open app' : 'Join in'}
          </Button>
        </a>
      </div>
    </nav>
  )
}

export default Navbar
