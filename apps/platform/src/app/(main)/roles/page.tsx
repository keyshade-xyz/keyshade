'use client'

import React from 'react'
import { useAtomValue } from 'jotai'
import CreateRoleDialog from '@/components/roles/createRoleDialog'
import RoleList from '@/components/roles/rolesList'
import ConfirmDeleteRole from '@/components/roles/confirmDeleteRole'
import EditRoleSheet from '@/components/roles/editRoleSheet'
import { editRoleOpenAtom, selectedRoleAtom } from '@/store'

function RolesPage(): React.JSX.Element {
  const selectedRole = useAtomValue(selectedRoleAtom)
  const isEditRolesOpen = useAtomValue(editRoleOpenAtom)

  return (
    <div className="flex flex-col gap-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.75rem] font-semibold ">Roles</h1>
        <CreateRoleDialog />
      </div>
      <RoleList />
      <ConfirmDeleteRole />

      {/* Edit role sheet */}
      {isEditRolesOpen && selectedRole ? <EditRoleSheet /> : null}
    </div>
  )
}

export default RolesPage
