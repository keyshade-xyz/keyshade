import { Suspense } from 'react'
import { GeistSansFont } from '../fonts/index'
import { Toaster } from '@/components/ui/sonner'
import './global.css'
import JotaiProvider from '@/components/jotaiProvider'
import OnlineStatusHandler from '@/components/common/online-status-handler'
import MobileOverlay from '@/components/common/mobile-overlay'
import { PostHogProvider } from '@/components/posthog-provider'

export const metadata = {
  title: 'Keyshade',
  description:
    'Manage all your secrets securely with public key encryption and realtime based tools, that seamlessly fits into your codebase'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html className={GeistSansFont.className} lang="en">
      <body>
        <Suspense>
          <PostHogProvider>
            <JotaiProvider>
              <>
                <OnlineStatusHandler />
                {children}
                <MobileOverlay />
                <Toaster richColors />
              </>
            </JotaiProvider>
          </PostHogProvider>
        </Suspense>
      </body>
    </html>
  )
}
