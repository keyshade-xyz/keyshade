'use client'

import { usePathname } from 'next/navigation'
import { TopGradientSVG } from '@public/hero'
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
    <main className="overflow-x-hidden" lang="en">
      {isSharePage ? (
        children
      ) : (
        <>
          <div className="relative flex w-full justify-center ">
            <Navbar />
            <TopGradientSVG className="absolute -z-10 w-[300vw] overflow-hidden md:w-full" />
          </div>
          {children}
          <Footer />
        </>
      )}
    </main>
  )
}
