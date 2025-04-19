'use client'

import React, { useEffect } from 'react'
import { useAtomValue, useSetAtom } from 'jotai'
import MembersHeader from '@/components/members/membersHeader'
import MembersTable from '@/components/members/membersTable'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { membersOfWorkspaceAtom, rolesOfWorkspaceAtom, selectedWorkspaceAtom } from '@/store'

function TeamPage(): React.JSX.Element {
  const setMembers = useSetAtom(membersOfWorkspaceAtom)
  const setRoles = useSetAtom(rolesOfWorkspaceAtom)
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)

  const getAllMembers = useHttp(() =>
    ControllerInstance.getInstance().workspaceMembershipController.getMembers(
      { workspaceSlug: currentWorkspace!.slug },
      {}
    )
  )

  const getAllRoles = useHttp(() =>
    ControllerInstance.getInstance().workspaceRoleController.getWorkspaceRolesOfWorkspace(
      { workspaceSlug: currentWorkspace!.slug },
      {}
    )
  )

  useEffect(() => {
    getAllMembers()
      .then(({ data, success }) => {
        if (success && data) {
          setMembers(data.items)
        }
      })

    getAllRoles()
      .then(({ data, success }) => {
        if (success && data) {
          setRoles(data.items)
        }
      })
  }, [getAllMembers, setMembers, getAllRoles, setRoles])

  return (
    <div className='flex flex-col gap-y-10'>
      <MembersHeader />
      <MembersTable />
    </div>
  )
}

export default TeamPage
