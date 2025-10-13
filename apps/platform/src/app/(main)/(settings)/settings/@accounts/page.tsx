'use client'

import React from 'react'
import AccountManagement from '@/components/userSettings/account-management'

function AccountsPage(): React.JSX.Element {
  return (
    <main className="flex flex-col gap-y-10">
      <AccountManagement />
    </main>
  )
}

export default AccountsPage
