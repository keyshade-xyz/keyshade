'use client'

import React from 'react'
import TeamHeader from '@/components/teams/teamHeader'
import { TeamTable } from '@/components/teams/teamTable'

function TeamPage(): React.JSX.Element {
  return (
    <div>
      <TeamHeader />
      <TeamTable />
    </div>
  )
}

export default TeamPage
