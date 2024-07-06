import React from 'react'
import Navbar from '@/components/shared/navbar'
import Sidebar from '@/components/shared/sidebar'

export default function AppLayout({
  children
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <main className="flex ">
      <Sidebar />
      <div className="m-8 h-dvh overflow-clip rounded-[1.125rem] bg-[#161819] md:h-[90vh] md:w-[90vw] 2xl:h-[93vh]">
        <Navbar />
        <div className="p-4">{children}</div>
      </div>
    </main>
  )
}
