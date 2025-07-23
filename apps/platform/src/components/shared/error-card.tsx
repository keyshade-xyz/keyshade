import React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'

interface ErrorCardProps {
  header?: string
  description?: string
}

function ErrorCard({ header, description }: ErrorCardProps) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 flex h-screen w-screen items-center justify-center bg-black bg-opacity-80">
      <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-[20px] bg-[#343537] p-10 text-center text-white shadow-xl">
        <h2 className=" text-3xl font-bold">{header}</h2>
        <p className="mb-6 leading-relaxed text-white/60">{description}</p>
        <Button onClick={() => router.push('/')} variant="secondary">
          Return to dashboard
        </Button>
      </div>
    </div>
  )
}

export default ErrorCard
