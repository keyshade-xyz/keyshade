import React from 'react'
import { useRouter } from 'next/navigation'
import { useAtomValue } from 'jotai'
import { Button } from '../ui/button'
import { selectedProjectAtom, selectedWorkspaceAtom } from '@/store'

interface ProjectErrorCardProps {
  tab: 'secrets' | 'variables' | 'environments'
}

function ProjectErrorCard({ tab }: ProjectErrorCardProps) {
  const router = useRouter()
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const projectOverviewUrl = `/${selectedWorkspace?.slug}/${selectedProject?.slug}?tab=overview`
  return (
    <div className="fixed inset-0 flex h-screen w-screen items-center justify-center bg-black bg-opacity-80">
      <div className="flex w-full max-w-md flex-col items-center justify-center gap-3 rounded-[20px] bg-[#343537] p-10 text-center text-white shadow-xl">
        <h2 className=" text-3xl font-bold">Insufficient permissions</h2>
        <p className="mb-6 leading-relaxed text-white/60">
          You do not have any of the required authorities to view {tab}
        </p>
        <Button
          onClick={() => router.push(projectOverviewUrl)}
          variant="secondary"
        >
          Return to overview
        </Button>
      </div>
    </div>
  )
}

export default ProjectErrorCard
