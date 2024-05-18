import React from 'react'
import Navbar from '@/components/shared/navbar'
import Sidebar from '@/components/shared/sidebar'

export default function AppLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <main className="flex h-dvh md:h-[90vh] 2xl:h-[93vh]">
      <Sidebar />
      <div className="m-8 h-full rounded-[1.125rem] bg-[#161819] md:w-[90vw] overflow-clip">
        <Navbar />
        <div className="p-4">{children}</div>
      </div>
    </main>
  )
}
