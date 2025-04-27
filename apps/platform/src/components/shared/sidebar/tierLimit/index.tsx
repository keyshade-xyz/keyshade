import { useAtom, useAtomValue } from 'jotai'
import React, { useEffect, useState } from 'react'
import { useSearchParams, usePathname } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  projectEnvironmentCountAtom,
  projectSecretCountAtom,
  projectVariableCountAtom,
  selectedProjectAtom,
  selectedWorkspaceAtom,
  workspaceMemberCountAtom,
  workspaceProjectCountAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

function TierLimit() {
  const [loading, setLoading] = useState<boolean>(true)
  const [projectCount, setProjectCount] = useAtom<number>(
    workspaceProjectCountAtom
  )
  const [memberCount, setMemberCount] = useAtom<number>(
    workspaceMemberCountAtom
  )
  const environmentCount = useAtomValue<number>(projectEnvironmentCountAtom)
  const secretCount = useAtomValue<number>(projectSecretCountAtom)
  const variableCount = useAtomValue<number>(projectVariableCountAtom)

  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const searchParams = useSearchParams()
  const pathname = usePathname()

  const tab = searchParams.get('tab')

  const getWorkspace = useHttp(() =>
    ControllerInstance.getInstance().workspaceController.getWorkspace({
      workspaceSlug: selectedWorkspace!.slug
    })
  )

  useEffect(() => {
    selectedWorkspace &&
      getWorkspace()
        .then(({ data, success }) => {
          if (success && data) {
            setProjectCount(data.totalProjects)
            setMemberCount(data.totalMembers)
          }
        })
        .finally(() => {
          setLoading(false)
        })
  }, [getWorkspace, selectedWorkspace, setProjectCount, setMemberCount])

  if (loading) {
    return (
      <>
        <div className="text-md mb-3 flex items-center justify-between">
          <Skeleton className="h-6 w-14" />
          <Skeleton className="h-6 w-14" />
        </div>
        <Skeleton className="h-2 w-full" />
      </>
    )
  }

  let title = 'Projects'
  let currentCount = projectCount
  let maxCount = selectedWorkspace?.maxAllowedProjects

  if (pathname === '/members') {
    title = 'Members'
    currentCount = memberCount
    maxCount = selectedWorkspace?.maxAllowedMembers
  } else if (tab === 'secret') {
    title = 'Secrets'
    currentCount = secretCount
    maxCount = selectedProject?.maxAllowedSecrets
  } else if (tab === 'variable') {
    title = 'Variables'
    currentCount = variableCount
    maxCount = selectedProject?.maxAllowedVariables
  } else if (tab === 'environment') {
    title = 'Environments'
    currentCount = environmentCount
    maxCount = selectedProject?.maxAllowedEnvironments
  }

  return (
    <div>
      <div className="text-md mb-3 flex items-center justify-between">
        <h1>{title}</h1>
        <p>
          {currentCount}/{maxCount}
        </p>
      </div>

      <Progress value={(currentCount / maxCount!) * 100} />
    </div>
  )
}

export default TierLimit
