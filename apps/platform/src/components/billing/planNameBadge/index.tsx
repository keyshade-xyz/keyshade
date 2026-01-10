import type { GetAllWorkspacesOfUserResponse } from '@keyshade/schema'
import React from 'react'
import { formatText } from '@/lib/utils'

function PlanNameBadge({
  planName
}: {
  planName: GetAllWorkspacesOfUserResponse['items'][number]['subscription']['plan']
}) {
  const bgColor = (plan: string) => {
    switch (plan) {
      case 'FREE':
        return 'bg-[#A7F3D0]'
      case 'HACKER':
        return 'bg-[#E68190]'
      case 'TEAM':
        return 'bg-[#0A9AF7]'
      case 'ENTERPRISE':
        return 'bg-[#C8AAE8]'
      default:
        return 'bg-[#E2E8F0]'
    }
  }

  return (
    <div className="mx-auto flex w-fit items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 p-1.5 px-3">
      <div className={`h-1.5 w-1.5 rounded-full ${bgColor(planName)}`} />
      <div>{formatText(planName)}</div>
    </div>
  )
}

export default PlanNameBadge
