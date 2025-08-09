'use client'

import { usePathname } from 'next/navigation'
import Footer from '@/components/shared/footer'
import Navbar from '@/components/shared/navbar'

export default function MainLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  const currentPath = usePathname()
  const isSharePage = currentPath.includes('/share')
  return (
    <main lang="en">
      {isSharePage ? (
        children
      ) : (
        <>
          <div className="flex w-full justify-center">
            <Navbar />
          </div>
          {children}
          <Footer />
        </>
      )}
    </main>
  )
}
