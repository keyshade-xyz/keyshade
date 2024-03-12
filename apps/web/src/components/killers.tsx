import React from 'react'

interface KillersProps {
  children: React.ReactNode
}
function Killers({ children }: KillersProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-cente gap-2">
      <div className="flex justify-center items-center h-[48px] w-[48px] rounded-full border-[#3a3e41] border-solid border-[2px] bg-gradient-to-br from-[#181c20] to-[#282d31]">
        {children}
      </div>
    </div>
  )
}

export default Killers
