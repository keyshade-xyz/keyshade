'use client'
import React, { useEffect, Suspense } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import { useSearchParams } from 'next/navigation'
import JoinedMemberPage from './@joined/page'
import InvitedMemberPage from './@invited/page'
import MembersHeader from '@/components/members/membersHeader'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { rolesOfWorkspaceAtom, selectedWorkspaceAtom } from '@/store'
import { PageTitle } from '@/components/common/page-title'

function DetailedMemberPage(): React.JSX.Element {
  const setRoles = useSetAtom(rolesOfWorkspaceAtom)
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)

  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'

  const getAllRoles = useHttp(() =>
    ControllerInstance.getInstance().workspaceRoleController.getWorkspaceRolesOfWorkspace(
      { workspaceSlug: currentWorkspace!.slug },
      {}
    )
  )

  useEffect(() => {
    getAllRoles().then(({ data, success }) => {
      if (success && data) {
        const nonAdminRoles = data.items.filter(
          (role) => !role.hasAdminAuthority
        )
        setRoles(nonAdminRoles)
      }
    })
  }, [getAllRoles, setRoles])

  return (
    <main>
      <div className="flex flex-col gap-2">
        <PageTitle title={`${currentWorkspace?.name} | Members`} />
        <MembersHeader />

        {tab === 'joined' && <JoinedMemberPage />}
        {tab === 'invited' && <InvitedMemberPage />}
      </div>
    </main>
  )
}

export default function MembersLayout(): React.JSX.Element {
  return (
    <main>
      <Suspense fallback={null}>
        <DetailedMemberPage />
      </Suspense>
    </main>
  )
}
