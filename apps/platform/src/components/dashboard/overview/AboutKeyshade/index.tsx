import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

function KeyshadeDocs() {
  return (
    <div className="flex h-fit w-full flex-col  rounded-2xl bg-white/5 p-4 pb-2 shadow-[0px_1px_2px_rgba(16,24,40,0.06),0px_1px_3px_rgba(16,24,40,0.1)]">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium text-white">Learn about keyshade</h1>
      </div>
      <div className="grid grid-cols-2 gap-2 py-4">
        <Link
          href="https://docs.keyshade.xyz/getting-started/adding-your-first-secret-and-variable"
          target="_blank"
        >
          <div className="flex cursor-pointer items-center justify-between gap-2 rounded-lg bg-white/10 p-2 text-white/70 duration-300 hover:scale-[1.02] hover:text-white">
            <p>How to create secrets?</p>
            <ArrowUpRight className="h-18 w-18" />
          </div>
        </Link>

        <Link
          href="https://docs.keyshade.xyz/getting-started/adding-your-first-secret-and-variable"
          target="_blank"
        >
          <div className="flex cursor-pointer items-center justify-between rounded-lg bg-white/10 p-2 text-white/70 duration-300 hover:scale-[1.02] hover:text-white">
            <p>How to create variables?</p>
            <ArrowUpRight className="h-18 w-18" />
          </div>
        </Link>

        <Link
          href="https://docs.keyshade.xyz/getting-started/adding-your-first-secret-and-variable"
          target="_blank"
        >
          <div className="flex cursor-pointer items-center justify-between rounded-lg bg-white/10 p-2 text-white/70 duration-300 hover:scale-[1.02] hover:text-white">
            <p>How to create environments?</p>
            <ArrowUpRight className="h-18 w-18" />
          </div>
        </Link>

        <Link href="https://docs.keyshade.xyz" target="_blank">
          <div className="flex cursor-pointer items-center justify-between rounded-lg bg-white/10 p-2 text-white/70 duration-300 hover:scale-[1.02] hover:text-white">
            <p>Docs & help</p>
            <ArrowUpRight className="h-18 w-18" />
          </div>
        </Link>
      </div>
    </div>
  )
}

export default KeyshadeDocs
