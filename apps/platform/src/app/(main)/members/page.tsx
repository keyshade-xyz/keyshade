'use client'

import React from 'react'
import MembersHeader from '@/components/members/membersHeader'
import MembersTable from '@/components/members/membersTable'

function TeamPage(): React.JSX.Element {
  return (
    <div className='flex flex-col gap-y-10'>
      <MembersHeader />
      <MembersTable />
    </div>
  )
}

export default TeamPage
