import React from 'react'
import { Button } from '@/components/ui/button'

function ShareSecretAlert({ alert }: { alert: string }) {
  const handleRedirect = () => {
    window.location.href = '/'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="mx-10 flex h-fit min-w-[30vw] max-w-md flex-col items-center justify-center gap-y-4 rounded-2xl border-2 border-[#B3EBF2]/10 px-7 py-6 drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] backdrop-blur-md"
        style={{
          background: `linear-gradient(130.61deg, rgba(12, 86, 96, 1 ) 0%, rgba(25, 177, 198, 0) 60%),
          linear-gradient(0deg, rgba(12, 86, 96, 0) 57.4%, rgba(12, 86, 96, 0.5) 100%)`
        }}
      >
        <p className="text-center text-lg text-white">{alert}</p>
        <Button
          className="w-full bg-[#EFFCFF] text-[#125D67] hover:bg-[#EFFCFF]/90"
          onClick={handleRedirect}
          variant="secondary"
        >
          Back To Homepage
        </Button>
      </div>
    </div>
  )
}

export default ShareSecretAlert
