import { useAtomValue } from 'jotai'
import React from 'react'
import RenewSubscription from '../renewSubscription'
import BillingDetail from './billingDetail'
import DownloadInvoice from './downloadInvoice'
import CancelPlan from './canclePlan'
import { selectedWorkspaceAtom } from '@/store'
import Visible from '@/components/common/visible'

export default function CurrentBillDetails() {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const isSubscriptionCancelled =
    currentWorkspace?.subscription.status === 'CANCELLED'

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
          <Visible if={isSubscriptionCancelled}>
            <RenewSubscription currentWorkspace={currentWorkspace} />
          </Visible>
          {/* <Button variant="secondary">Update your Plan</Button>  */}
        </div>
        <BillingDetail currentWorkspace={currentWorkspace} />
      </div>

      <DownloadInvoice currentWorkspace={currentWorkspace} />
      <Visible if={!isSubscriptionCancelled}>
        <CancelPlan currentWorkspace={currentWorkspace} />
      </Visible>
    </div>
  )
}
