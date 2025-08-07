import { useAtomValue } from 'jotai'
import React from 'react'
import BillingDetail from './billingDetail'
import DownloadInvoice from './downloadInvoice'
import CancelPlan from './canclePlan'
import { selectedWorkspaceAtom } from '@/store'
// import { Button } from '@/components/ui/button'

export default function CurrentBillDetails() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)

  return (
    <div className="flex flex-col gap-12">
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Billing</h1>
            <p className="text-sm text-neutral-300">
              Here you can find the details of your current bill and
              subscription.
            </p>
          </div>
          {/* <Button variant="secondary">Update your Plan</Button>  */}
        </div>
        <BillingDetail currentWorkspace={currentWorkspace} />
      </div>

      <DownloadInvoice currentWorkspace={currentWorkspace} />
      <CancelPlan currentWorkspace={currentWorkspace} />
    </div>
  )
}
