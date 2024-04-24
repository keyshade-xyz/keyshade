'use client'
import { useEffect, useRef } from 'react'
import { KeyshadeBigSVG } from '@public/svg/auth'
import { GeistSansFont, NunitoSansFont } from '@/fonts'
import { Button } from '@/components/ui/button'

export default function AuthDetailsPage(): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <main className="flex h-dvh items-center justify-center justify-items-center px-4">
      <div className="flex flex-col ">
        <div className="mb-12 flex flex-col items-center">
          <KeyshadeBigSVG />
          <h1
            className={`${GeistSansFont.className} text-[2.5rem] font-semibold`}
          >
            Invite Teammates
          </h1>
          <div className="flex w-[23rem] flex-col items-center text-center">
            <span className={GeistSansFont.className}>
              Invite your teammates and have the best team experience while
              securing your security
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-y-12 rounded-xl bg-[#191A1C] px-10 py-5 md:px-[7vw] md:py-8 2xl:py-12">
          <div className="space-y-4 md:w-[20vw]">
            <div>
              <span className={`${NunitoSansFont.className} text-sm`}>
                Add Email
              </span>
              <div
                className={`${NunitoSansFont.className} flex h-[10vh] gap-1 cursor-text flex-col items-start rounded-md border border-white/10 bg-neutral-800 px-3 py-2 text-sm`}
                onClick={() => {
                  inputRef.current?.focus()
                }}
                onKeyDown={(e) => {
                  // Enter or space key
                  if (e.key === 'Enter' || e.key === ' ') {
                    inputRef.current?.focus()
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-2 rounded-lg border border-white/40 p-1 hover:shadow">
                  swatilakah25@gmail
                  <button className="" type="button">
                    <svg
                      className="svg"
                      height="10"
                      viewBox="0 0 10 10"
                      width="10"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 4.293 8.646.646l.708.708L5.707 5l3.647 3.646-.708.708L5 5.707 1.354 9.354l-.708-.708L4.293 5 .646 1.354l.708-.707L5 4.293z"
                        fill="#fff"
                        fillOpacity="1"
                        fillRule="evenodd"
                        stroke="none"
                      />
                    </svg>
                  </button>
                </div>
                <input
                  className="flex h-10 w-full border border-transparent bg-transparent text-sm ring-offset-transparent placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-transparent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  ref={inputRef}
                  type="email"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <Button className="w-full">Send Invite</Button>
            <Button className="w-full">Skip</Button>
          </div>
        </div>
      </div>
    </main>
  )
}
