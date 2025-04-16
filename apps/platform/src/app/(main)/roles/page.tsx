'use client'

import React from 'react'
import CreateRolesDialog from '@/components/roles/createRolesDialog'
import RoleList from '@/components/roles/rolesList'
import ConfirmDeleteRole from '@/components/roles/confirmDeleteRole'

function RolesPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-y-10">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.75rem] font-semibold ">Roles</h1>
        <CreateRolesDialog />
      </div>
      <RoleList />
      <ConfirmDeleteRole />
    </div>
  )
}

export default RolesPage
