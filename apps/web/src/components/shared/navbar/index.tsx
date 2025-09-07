'use client'
import Link from 'next/link'
import { ArrowRight, Logo } from '@public/shared'
import { GithubSVG } from '@public/navbar'
import { Geist } from 'next/font/google'
import { isUserLoggedIn } from '@/utils/is-user-logged-in'
import CtaButton from '@/components/CtaButton'
import TertiaryButton from '@/components/TertiaryButton'

const geist = Geist({
  subsets: ['latin']
})

function Navbar(): React.JSX.Element {
  const navContent: { name: string; href: string }[] = [
    {
      name: 'Docs',
      href: 'https://docs.keyshade.xyz/'
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
      href: 'https://blog.keyshade.xyz/'
    }
  ]

  return (
    <div className="mx-12 my-4 flex w-full max-w-[82rem] items-center justify-between">
      <Link href="/">
        <Logo className="w-[270px]" />
      </Link>
      <div className={geist.className}>
        {navContent.map((item) => {
          return (
            <Link className="px-4 py-2" href={item.href} key={item.name}>
              {item.name}
            </Link>
          )
        })}
      </div>
      <div className="flex items-center gap-4">
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
          href="https://app.keyshade.xyz"
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
  )
}

export default Navbar
