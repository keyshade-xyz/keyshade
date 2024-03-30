import Link from 'next/link'
import { Logo, LogoM } from '@public/shared'
import { Button } from '@/components/ui/moving-border'

function Navbar(): React.JSX.Element {
  return (
    <nav
      className="mt-5 flex mx-10 w-full md:w-[79.625rem] items-center justify-between rounded-full border border-[#728689]/60 px-2 md:px-[2.94rem] py-1"
      style={{
        background:
          'linear-gradient(180deg, rgba(226, 232, 255, 0.15) 0%, rgba(226, 232, 255, 0.03) 100%)'
      }}
    >
      <Link href="/" tabIndex={-1}>
        <Logo className="hidden md:flex" />
        <LogoM className="flex md:hidden" />
      </Link>
      <ul className="hidden md:flex gap-x-4 text-white/60">
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
          <a
            href="https://dev.to/keyshade"
            rel="noopener noreferrer"
            target="_blank"
          >
            Blog
          </a>
        </li>
      </ul>
      <a href="https://git.new/keyshade">
        <Button duration={6 * 1000}>View GitHub</Button>
      </a>
    </nav>
  )
}

export default Navbar
