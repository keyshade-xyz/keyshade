'use client'

import React, { useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import MembersHeader from '@/components/members/membersHeader'
import MembersTable from '@/components/members/membersTable'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { membersOfWorkspaceAtom, rolesOfWorkspaceAtom, selectedWorkspaceAtom } from '@/store'
import { PageTitle } from '@/components/common/page-title'

function TeamPage(): React.JSX.Element {
  const setMembers = useSetAtom(membersOfWorkspaceAtom)
  const setRoles = useSetAtom(rolesOfWorkspaceAtom)
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)

  const getAllRoles = useHttp(() =>
    ControllerInstance.getInstance().workspaceRoleController.getWorkspaceRolesOfWorkspace(
      { workspaceSlug: currentWorkspace!.slug },
      {}
    )
  )

  useEffect(() => {
    getAllRoles().then(({ data, success }) => {
      if (success && data) {
        setRoles(data.items)
      }
    })
  }, [setMembers, getAllRoles, setRoles])

  return (
    <div className='flex flex-col gap-y-10'>
      <PageTitle title={`${currentWorkspace?.name} | Members`} />
      <MembersHeader />
      <MembersTable />
    </div>
  )
}

export default TeamPage
