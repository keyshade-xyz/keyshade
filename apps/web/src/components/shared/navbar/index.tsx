import Link from 'next/link'
import { Logo } from '@public/shared'
import { Button } from '@/components/ui/moving-border'

function Navbar(): React.JSX.Element {
  return (
    <nav
      className="mt-5 flex w-[79.625rem] items-center justify-between rounded-full border border-[#728689]/60 px-[2.94rem] py-3"
      style={{
        background:
          'linear-gradient(180deg, rgba(226, 232, 255, 0.15) 0%, rgba(226, 232, 255, 0.03) 100%)'
      }}
    >
      <Link href="/" tabIndex={-1}>
        <Logo />
      </Link>
      <a href="https://github.com/keyshade-xyz/keyshade">
        <Button duration={6 * 1000}>View GitHub</Button>
      </a>
    </nav>
  )
}

export default Navbar
