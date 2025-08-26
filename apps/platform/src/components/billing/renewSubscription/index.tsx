import type { GetAllWorkspacesOfUserResponse } from '@keyshade/schema'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface RenewPlanProps {
  currentWorkspace: GetAllWorkspacesOfUserResponse['items'][number] | null
}

function RenewSubscription({ currentWorkspace }: RenewPlanProps) {
  const [loading, setLoading] = useState<boolean>(false)

  const unCancelSubscription = useHttp(() =>
    ControllerInstance.getInstance().paymentController.uncancelSubscription({
      workspaceSlug: currentWorkspace?.slug ?? ''
    })
  )

  const handleRenewSubscription = async () => {
    setLoading(true)
    toast.loading('Renewing subscription...')
    const { error, success } = await unCancelSubscription()
    if (error) {
      toast.dismiss()
      toast.error('Failed to renew subscription')
    }
    if (success) {
      toast.dismiss()
      toast.success('Subscription renewed successfully')
      window.location.reload()
    }
    setLoading(false)
  }
  return (
    <Button
      disabled={loading}
      onClick={handleRenewSubscription}
      variant="secondary"
    >
      {loading ? 'Renewing...' : 'Renew Now'}
    </Button>
  )
}

export default RenewSubscription
