import React from 'react'
import Sidebar from '@/components/shared/sidebar'
import Navbar from '@/components/shared/navbar'

export default function AppLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <main className="flex h-screen">
      <Sidebar />
      <div className="m-4 h-dvh overflow-hidden rounded-[1.125rem] bg-[#161819] md:h-[96vh] md:w-[90vw] 2xl:h-[96.5vh] flex-1 min-w-0">
        <div className="flex h-full flex-col">
          <Navbar />
          <div className="flex-1 overflow-auto p-4">{children}</div>
        </div>
      </div>
    </main>
  )
}
