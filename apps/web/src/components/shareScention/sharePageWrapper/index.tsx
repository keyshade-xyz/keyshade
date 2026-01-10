import React from 'react'

function SharePageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full p-1.5">
      <div
        className="relative flex justify-center rounded-2xl border-2 border-[#B3EBF2]/20 bg-[#06728A]/10 p-3 shadow-[inset_0px_4px_20px_rgba(179,235,242,0.2)] backdrop-blur-md"
        style={{ minHeight: 'calc(100vh - 12px)' }}
      >
        <div
          className="absolute -top-28 h-40 w-[60%]"
          style={{
            background:
              'radial-gradient(50% 50% at 50% 50%, rgba(179, 235, 242, 0.6) 0%, rgba(65, 143, 153, 0) 100%)'
          }}
        />
        <div className="absolute inset-0 mx-2 overflow-hidden bg-transparent bg-[radial-gradient(#BFBFBF33_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="flex h-full flex-col items-center gap-5">
          {children}
        </div>
      </div>
    </div>
  )
}

export default SharePageWrapper
