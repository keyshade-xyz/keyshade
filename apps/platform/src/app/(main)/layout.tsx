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
      <div className="bg-night-d border-white/8 h-dvh min-w-0 flex-1 overflow-hidden border-l md:w-[90vw] ">
        <div className="flex h-full flex-col">
          <Navbar />
          <div className="flex-1 overflow-auto p-4">{children}</div>
        </div>
      </div>
    </main>
  )
}
