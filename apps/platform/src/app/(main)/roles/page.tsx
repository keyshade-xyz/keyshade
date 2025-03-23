'use client'

import React from 'react'
import CreateRolesDialog from '@/components/roles/createRolesDialog'

function RolesPage(): React.JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.75rem] font-semibold ">Roles</h1>
        <CreateRolesDialog />
      </div>
    </div>
  )
}

export default RolesPage
