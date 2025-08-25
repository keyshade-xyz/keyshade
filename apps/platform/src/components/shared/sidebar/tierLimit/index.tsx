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
  workspaceIntegrationCountAtom,
  workspaceMemberCountAtom,
  workspaceProjectCountAtom,
  workspaceRolesCountAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'

function Tiers({ hideTiers }: { hideTiers?: boolean }) {
  const [loading, setLoading] = useState<boolean>(true)
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const tab = searchParams.get('tab')
  const [projectCount, setProjectCount] = useAtom<number>(
    workspaceProjectCountAtom
  )
  const [memberCount, setMemberCount] = useAtom<number>(
    workspaceMemberCountAtom
  )
  const [rolesCount, setRolesCount] = useAtom<number>(workspaceRolesCountAtom)
  const [integrationsCount, setIntegrationsCount] = useAtom<number>(
    workspaceIntegrationCountAtom
  )
  const environmentCount = useAtomValue<number>(projectEnvironmentCountAtom)
  const secretCount = useAtomValue<number>(projectSecretCountAtom)
  const variableCount = useAtomValue<number>(projectVariableCountAtom)

  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

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
            setRolesCount(data.totalRoles)
            setIntegrationsCount(data.totalIntegrations)
          }
        })
        .finally(() => {
          setLoading(false)
        })
  }, [
    getWorkspace,
    selectedWorkspace,
    setProjectCount,
    setMemberCount,
    setRolesCount,
    setIntegrationsCount
  ])

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
  } else if (pathname === '/roles') {
    limits = [
      {
        title: 'Roles',
        currentCount: rolesCount,
        maxCount: selectedWorkspace?.maxAllowedRoles
      }
    ]
  } else if (
    pathname === '/integrations' ||
    pathname.startsWith('/integrations/')
  ) {
    limits = [
      {
        title: 'Integrations',
        currentCount: integrationsCount,
        maxCount: selectedWorkspace?.maxAllowedIntegrations
      }
    ]
  } else if (pathname === `${selectedWorkspace?.slug}/billing`) {
    limits = []
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
  if (hideTiers) {
    return null
  }

  return (
    <div>
      {limits.map((limit) => {
        const isUnlimited = limit.maxCount === -1

        return (
          <div className="pb-2" key={limit.title}>
            <div className="text-md mb-3 flex items-center justify-between">
              <h1>{limit.title}</h1>
              <p className="text-sm text-white/60">
                {isUnlimited
                  ? 'Unlimited'
                  : `${limit.currentCount}/${limit.maxCount}`}
              </p>
            </div>
            {!isUnlimited && (
              <Progress value={(limit.currentCount / limit.maxCount!) * 100} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function TierLimit() {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const pathname = usePathname()
  const formatPlan = (): string | undefined => {
    if (selectedWorkspace?.subscription === undefined) {
      return undefined
    }
    return `${selectedWorkspace.subscription.plan[0].toUpperCase()}${selectedWorkspace.subscription.plan.slice(1).toLowerCase()}`
  }

  const shouldHideTiers =
    pathname.endsWith('/billing') || pathname.endsWith('/settings')

  return shouldHideTiers ? (
    <Tiers hideTiers />
  ) : (
    <div className="absolute bottom-12 w-[16rem] rounded-lg border border-white/10 bg-white/5 p-4">
      <div className="mb-5 flex items-center gap-3">
        <Button className="h-6 cursor-default bg-[#60A5FA4D] p-3 text-white hover:bg-[#60A5FA4D]">
          {formatPlan() === undefined ? (
            <Skeleton className="h-2 w-14" />
          ) : (
            formatPlan()
          )}
        </Button>
      </div>
      <Tiers />
    </div>
  )
}
