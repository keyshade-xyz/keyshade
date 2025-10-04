'use client'

import React from 'react'
import { useAtomValue } from 'jotai'
import CreateRoleDialog from '@/components/roles/createRoleDialog'
import RoleList from '@/components/roles/rolesList'
import ConfirmDeleteRole from '@/components/roles/confirmDeleteRole'
import EditRoleSheet from '@/components/roles/editRoleSheet'
import {
  editRoleOpenAtom,
  selectedRoleAtom,
  selectedWorkspaceAtom
} from '@/store'
import { PageTitle } from '@/components/common/page-title'

function RolesPage(): React.JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const selectedRole = useAtomValue(selectedRoleAtom)
  const isEditRolesOpen = useAtomValue(editRoleOpenAtom)

  const shouldShowEditRoleSheet = isEditRolesOpen && selectedRole

  return (
    <div className="flex flex-col gap-y-10">
      <PageTitle title={`${selectedWorkspace?.name} | Roles`} />
      <div className="flex items-center justify-between">
        <h1 className="text-[1.75rem] font-semibold ">Roles</h1>
        <CreateRoleDialog />
      </div>
      <RoleList />
      <ConfirmDeleteRole />

      {/* Edit role sheet */}
      {shouldShowEditRoleSheet ? <EditRoleSheet /> : null}
    </div>
  )
}

export default RolesPage
