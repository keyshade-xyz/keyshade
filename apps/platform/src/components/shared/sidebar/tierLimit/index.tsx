import { useAtom, useAtomValue } from 'jotai'
import React, { Suspense, useEffect, useState } from 'react'
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

function Tiers() {
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

  let limits = [
    {
      title: 'Projects',
      currentCount: projectCount,
      maxCount: selectedWorkspace?.maxAllowedProjects
    }
  ]

  if (pathname === '/members') {
    limits = [
      {
        title: 'Members',
        currentCount: memberCount,
        maxCount: selectedWorkspace?.maxAllowedMembers
      }
    ]
  } else if (tab === 'overview') {
    limits = [
      {
        title: 'Secrets',
        currentCount: secretCount,
        maxCount: selectedProject?.maxAllowedSecrets
      },
      {
        title: 'Variables',
        currentCount: variableCount,
        maxCount: selectedProject?.maxAllowedVariables
      },
      {
        title: 'Environments',
        currentCount: environmentCount,
        maxCount: selectedProject?.maxAllowedEnvironments
      }
    ]
  } else if (tab === 'secret') {
    limits = [
      {
        title: 'Secrets',
        currentCount: secretCount,
        maxCount: selectedProject?.maxAllowedSecrets
      }
    ]
  } else if (tab === 'variable') {
    limits = [
      {
        title: 'Variables',
        currentCount: variableCount,
        maxCount: selectedProject?.maxAllowedVariables
      }
    ]
  } else if (tab === 'environment') {
    limits = [
      {
        title: 'Environments',
        currentCount: environmentCount,
        maxCount: selectedProject?.maxAllowedEnvironments
      }
    ]
  }

  return (
    <div>
      {limits.map((limit) => (
        <div className="pb-2" key={limit.title}>
          <div className="text-md mb-3 flex items-center justify-between">
            <h1>{limit.title}</h1>
            <p>
              {limit.currentCount}/{limit.maxCount}
            </p>
          </div>
          <Progress value={(limit.currentCount / limit.maxCount!) * 100} />
        </div>
      ))}
    </div>
  )
}

export default function TierLimit() {
  return (
    <Suspense fallback={null}>
      <Tiers />
    </Suspense>
  )
}
