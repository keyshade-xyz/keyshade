'use client'

import React, { useEffect } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import MembersHeader from '@/components/members/membersHeader'
import MembersTable from '@/components/members/membersTable'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { membersOfWorkspaceAtom, rolesOfWorkspaceAtom, selectedWorkspaceAtom } from '@/store'

function TeamPage(): React.JSX.Element {
  const [members, setMembers] = useAtom(membersOfWorkspaceAtom)
  const [roles, setRoles] = useAtom(rolesOfWorkspaceAtom)
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
          // eslint-disable-next-line no-console -- Need to log this
          console.log("data: ", data)
          setMembers(data.items)
        }
      })

    getAllRoles()
      .then(({ data, success }) => {
        if (success && data) {
          // eslint-disable-next-line no-console -- Need to log this
          console.log("data: ", data)
          // @ts-expect-error -- Need to resolve the type issue
          setRoles(data.items)
        }
      })
  }, [getAllMembers, setMembers, getAllRoles, setRoles])

  return (
    <div className='flex flex-col gap-y-10'>
      <MembersHeader members={members} roles={roles} />
      <MembersTable members={members} />
    </div>
  )
}

export default TeamPage
