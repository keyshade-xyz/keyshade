import React from 'react'
import type { GetAllWorkspacesOfUserResponse } from '@keyshade/schema'
import dayjs from 'dayjs'
import { useAtomValue } from 'jotai'
import DetailContainer from './detail-container'
import TierLimitItem from './tier-limit-item'
import BillingDetailRow from './billing-detail-row'
import { Separator } from '@/components/ui/separator'
import { PricingTiers } from '@/constants/billing/planCard'
import { Badge } from '@/components/ui/badge'
import { formatName } from '@/lib/format-name'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import {
  workspaceIntegrationCountAtom,
  workspaceMemberCountAtom,
  workspaceProjectCountAtom,
  workspaceRolesCountAtom
} from '@/store'

interface BillingDetailProps {
  currentWorkspace: GetAllWorkspacesOfUserResponse['items'][number] | null
}

export default function BillingDetail({
  currentWorkspace
}: BillingDetailProps) {
  const currentSubscription = currentWorkspace?.subscription
  const workspaceProjectCount = useAtomValue(workspaceProjectCountAtom)
  const workspaceMemberCount = useAtomValue(workspaceMemberCountAtom)
  const workspaceRolesCount = useAtomValue(workspaceRolesCountAtom)
  const workspaceIntegrationCount = useAtomValue(workspaceIntegrationCountAtom)

  const formatPlan = (): string => {
    return `${currentSubscription?.plan[0].toUpperCase()}${currentSubscription?.plan.slice(1).toLowerCase()}`
  }

  const calculateTotalSeatPrice = () => {
    const isAnnual = currentSubscription?.isAnnual
    const seats = currentSubscription?.seatsBooked || 1

    if (!PricingTiers[formatPlan()]) {
      // eslint-disable-next-line no-console -- this is a fallback in case the plan is not found
      console.warn(`Plan "${formatPlan()}" not found in PricingTiers`)
      return 0
    }
    const amount = Number(
      PricingTiers[formatPlan()][isAnnual ? 'annually' : 'monthly'].replace(
        '$',
        ''
      )
    )
    return amount * seats
  }

  const calculateCompoundedPrice = () => {
    const isAnnual = currentSubscription?.isAnnual
    const monthsPaid = isAnnual ? 12 : 1

    const roundedTotal = Math.round(calculateTotalSeatPrice() * monthsPaid * 100) / 100

    return roundedTotal
  }

  const monthText = () => (currentSubscription?.isAnnual ? '12 months' : '1 month')

  const planPrice = (): `$${number}` => {
    const isAnnual = currentWorkspace?.subscription.isAnnual

    if (!PricingTiers[formatPlan()]) {
      // eslint-disable-next-line no-console -- this is a fallback in case the plan is not found
      console.warn(`Plan "${formatPlan()}" not found in PricingTiers`)
      return '$0' as `$${number}`
    }

    return PricingTiers[formatPlan()][isAnnual ? 'annually' : 'monthly']
  }

  const renderSubscriptionStatusBadge = (
    status:
      | GetAllWorkspacesOfUserResponse['items'][number]['subscription']['status']
      | undefined,
    endDate?: string
  ) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge color="green" icon="done" type="icon" variant="solid">
            {formatName(status)}
          </Badge>
        )
      case 'CANCELLED':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge color="red" icon="cancel" type="icon" variant="solid">
                  {formatName(status)}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-center" sideOffset={6}>
                <p className="text-xs text-red-600/70">
                  Your workspace plan will be reverted to Free tier on{' '}
                  <span className="font-bold text-red-600">
                    {endDate ? dayjs(endDate).format('MMMM D, YYYY') : null}
                  </span>
                  .
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      case 'INCOMPLETE':
        return (
          <Badge color="red" icon="cancel" type="icon" variant="solid">
            {formatName(status)}
          </Badge>
        )
      case 'PAST_DUE':
        return (
          <Badge color="yellow" icon="waiting" type="icon" variant="solid">
            {formatName(status)}
          </Badge>
        )

      case 'UNPAID':
        return (
          <Badge color="yellow" icon="waiting" type="icon" variant="solid">
            {formatName(status)}
          </Badge>
        )
      default:
        break
    }
  }

  const isPlanActive = currentSubscription?.status === 'ACTIVE'
  const billingCycle = currentSubscription?.isAnnual ? 'Annual' : 'Monthly'

  return (
    <div className="mt-7 grid grid-cols-2 gap-6">
      <DetailContainer>
        <div className="gap-1">
          <h3 className="text-xl font-bold">Tier limits</h3>
          <p className="text-sm text-neutral-300">
            Check your tier limits below to ensure you are within the allowed
            limits for your plan.
          </p>
        </div>

        <Separator className="bg-white/20" />

        <div className="mt-5 grid grid-cols-2 grid-rows-2 gap-8">
          <TierLimitItem
            current={workspaceProjectCount}
            label="Projects"
            max={currentWorkspace?.maxAllowedProjects ?? 1}
          />

          <TierLimitItem
            current={workspaceMemberCount}
            label="Members"
            max={currentWorkspace?.maxAllowedMembers ?? 1}
          />

          <TierLimitItem
            current={workspaceIntegrationCount}
            label="Integrations"
            max={currentWorkspace?.maxAllowedIntegrations ?? 1}
          />

          <TierLimitItem
            current={workspaceRolesCount}
            label="Roles"
            max={currentWorkspace?.maxAllowedRoles ?? 1}
          />
        </div>
      </DetailContainer>
      <DetailContainer>
        <div className="gap-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-xl font-bold">
                {formatName(currentSubscription?.plan as string)} plan{' '}
                {renderSubscriptionStatusBadge(
                  currentSubscription?.status,
                  currentSubscription?.renewsOn
                )}
              </h3>
              <p className="text-sm text-neutral-300">
                More detail about the pricing and plan details.
              </p>
            </div>

            <p className="text-end text-xs text-neutral-300">
              <span className="text-2xl font-bold text-white">
                {planPrice()}
              </span>{' '}
              <br />
              per user / month
            </p>
          </div>
        </div>

        <Separator className="bg-white/20" />
        <div className="flex flex-col gap-5">
          <BillingDetailRow
            label="Seats"
            value={`x${currentSubscription?.seatsBooked || 0}`}
          />
          <BillingDetailRow
            label="Total price for seats"
            value={`$${calculateTotalSeatPrice()}`}
          />
          <BillingDetailRow
            label="Compounded price"
            value={`$${calculateCompoundedPrice()} (${monthText()})`}
          />
          <BillingDetailRow
            label="Next Billing Date"
            value={
              isPlanActive
                ? dayjs(currentSubscription.renewsOn).format('MMMM D, YYYY')
                : 'N/A'
            }
          />
          <BillingDetailRow
            label="Billing Cycle"
            value={isPlanActive ? billingCycle : 'N/A'}
          />
        </div>
      </DetailContainer>
    </div>
  )
}
