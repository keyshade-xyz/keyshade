'use client'
import React from 'react'
import { useAtomValue } from 'jotai'
import { Loader2Icon } from 'lucide-react'
import NewBilling from '@/components/billing/newBilling'
import { selectedWorkspaceAtom } from '@/store'
import Visible from '@/components/common/visible'
import CurrentBillDetails from '@/components/billing/currentBillDetails'

export default function Billing() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const isInFreeTier = currentWorkspace?.subscription.plan === 'FREE'

  if (currentWorkspace?.subscription === undefined) {
    return (
      <div className="flex h-full w-full items-center justify-center justify-items-center">
        <Loader2Icon className="h-[3rem] w-[3rem] animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <Visible if={isInFreeTier}>
        <NewBilling />
      </Visible>
      <Visible if={!isInFreeTier}>
        <CurrentBillDetails />
      </Visible>
    </div>
  )
}
