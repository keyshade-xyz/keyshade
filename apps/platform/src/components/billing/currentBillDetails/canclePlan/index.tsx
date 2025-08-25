import React, { useState } from 'react'
import type {
  GetAllWorkspacesOfUserResponse,
  SubscriptionCancellationReasonEnum
} from '@keyshade/schema'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Textarea } from '@/components/ui/textarea'
import Visible from '@/components/common/visible'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'

interface CancelPlanProps {
  currentWorkspace: GetAllWorkspacesOfUserResponse['items'][number] | null
}

export default function CancelPlan({ currentWorkspace }: CancelPlanProps) {
  const [cancelReason, setCancelReason] = useState<
    SubscriptionCancellationReasonEnum | undefined
  >(undefined)
  const [cancelMessage, setCancelMessage] = useState<string | undefined>(
    undefined
  )

  const reasons: Record<SubscriptionCancellationReasonEnum, string> = {
    customer_service: 'Customer Service',
    low_quality: 'Low Quality',
    missing_features: 'Missing Features',
    switched_service: 'Switched service',
    too_complex: 'Too complex',
    too_expensive: 'Too expensive',
    unused: 'Unused',
    other: 'Other'
  }

  const cancelSubscription = useHttp(() => {
    return ControllerInstance.getInstance().paymentController.cancelSubscription(
      {
        workspaceSlug: currentWorkspace?.slug ?? '',
        reason: cancelReason,
        comment: cancelMessage
      }
    )
  })

  const handleCancelSubscription = async () => {
    toast.loading('Cancelling your subscription...')
    const { error, success } = await cancelSubscription()
    if (error) {
      toast.dismiss()
      toast.error(
        'We are unable to process your request to cancel the subscription'
      )
    }
    if (success) {
      toast.dismiss()
      toast.success('We successgully cancelled the subscription')
      window.location.reload()
    }
  }

  return (
    <div className="mb-20 flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Cancel Subscription </h1>
        <p className="text-sm text-neutral-300">
          Feeling to come back later? We will be waiting for you :)
        </p>
      </div>
      <div>
        <div className="mb-2">
          Please let us know the reason of the cancellation{' '}
          <span className="text-red-500">*</span>{' '}
        </div>
        <div className="flex gap-x-6">
          <div>
            <Select
              onValueChange={(reasonKey) => {
                setCancelReason(reasonKey as SubscriptionCancellationReasonEnum)
              }}
            >
              <SelectTrigger className="w-[20vw]">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {Object.keys(reasons).map((keys) => {
                    return (
                      <SelectItem key={keys} value={keys}>
                        {reasons[keys]}
                      </SelectItem>
                    )
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Visible if={cancelReason === 'other'}>
              <Textarea
                className="col-span-3 mt-3 h-[5.625rem] w-[20vw] resize-none gap-[0.25rem]"
                id="name"
                onChange={(e) => {
                  setCancelMessage(e.target.value)
                }}
                placeholder="We would like to know what we can improve"
              />
            </Visible>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={cancelReason === undefined}
                variant="destructive"
              >
                Cancel Subscription
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[12px] border border-white/10 bg-[#1E1E1F] ">
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. Your subscription will be
                  cancelled and you will be downgraded to the free plan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>I change my mind</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-red-500 text-zinc-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-zinc-50 dark:hover:bg-red-900/90"
                  disabled={!cancelReason}
                  onClick={() => {
                    handleCancelSubscription()
                  }}
                  type="button"
                >
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  )
}
