'use client'
import { useAtomValue } from 'jotai'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { selectedWorkspaceAtom } from '@/store'

function Page() {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const router = useRouter()

  useEffect(() => {
    if (selectedWorkspace?.slug) {
      router.replace(`/${selectedWorkspace.slug}/billing`)
    }
  }, [selectedWorkspace, router])

  return <div>Redirecting...</div>
}

export default Page
