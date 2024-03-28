import Script from 'next/script'
import './global.css'
import type { Metadata } from 'next'
// eslint-disable-next-line import/no-extraneous-dependencies -- required for mixpanel
import { init } from 'mixpanel-browser'

const description =
  'Manage all your secrets securely with public key encryption and realtime based tools, that seamlessly fits into your codebase'
const name = 'keyshade'

export const metadata: Metadata = {
  metadataBase: new URL('https://keyshade.xyz/'),
  title: {
    default: name,
    template: `%s | ${name}`
  },
  description,
  keywords: [
    'Keyshade',
    'secrets integration',
    'codebase security',
    'Public Key Encryption',
    'secret rotation',
    'auto revoke',
    'collaboration',
    'data security',
    'secrets management',
    'secure code secrets',
    'realtime secrets integration',
    'encryption for secrets',
    'automated secret rotation',
    'team collaboration secrets',
    'secure runtime environment',
    'secrets management tool',
    'codebase security solution',
    'cybersecurity for secrets',
    'API security',
    'key management',
    'secure data transfer',
    'secure secrets sharing',
    'effortless secrets management',
    'Keyshade features',
    'cybersecurity solution',
    'secure software development',
    'automated access revocation',
    'secure secrets storage',
    'developer tools security',
    'API key security',
    'codebase encryption',
    'team-based secrets management'
  ],
  applicationName: name,
  openGraph: {
    title: name,
    description,
    type: 'website',
    locale: 'en_US',
    images: 'https://keyshade.xyz/thumbnail.png'
  },
  twitter: {
    card: 'summary_large_image',
    title: name,
    description,
    creator: '@keyshade_xyz',
    creatorId: '1738929014016966656'
  },
  robots: {
    index: true,
    follow: true,
    noarchive: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true
    }
  }
}
export default function RootLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="en">
      <head>
        <Script id="mixpanel-analytics">
          {init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
            debug: process.env.NODE_ENV === 'development',
            track_pageview: true,
            persistence: 'localStorage'
          })}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
