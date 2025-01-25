import { Toaster } from '@/components/ui/sonner'
import './global.css'
import JotaiProvider from '@/components/jotaiProvider'
import OnlineStatusHandler from '@/components/common/online-status-handler'

export const metadata = {
  title: 'Keyshade',
  description: 'Generated by create-nx-workspace'
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <JotaiProvider>
          <>
            <OnlineStatusHandler />
            {children}
          </>
        </JotaiProvider>
      </body>
      <Toaster richColors />
    </html>
  )
}
