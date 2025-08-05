import React from 'react'
import type { GetAllWorkspacesOfUserResponse } from '@keyshade/schema'
import dayjs from 'dayjs'
import DetailContainer from './detail-container'
import TierLimitItem from './tier-limit-item'
import BillingDetailRow from './billing-detail-row'
import { Separator } from '@/components/ui/separator'
import { PricingTiers } from '@/constants/billing/planCard'
import { Badge } from '@/components/ui/badge'
import { formatName } from '@/lib/format-name'

interface BillingDetailProps {
  currentWorkspace: GetAllWorkspacesOfUserResponse['items'][number] | null
}

export default function BillingDetail({
  currentWorkspace
}: BillingDetailProps) {
  const currentSubscription = currentWorkspace?.subscription

  const formatPlan = (): string => {
    return `${currentSubscription?.plan[0].toUpperCase()}${currentSubscription?.plan.slice(1).toLowerCase()}`
  }

  const calculateTotalPrice = () => {
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
      | undefined
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
          <Badge color="red" icon="cancel" type="icon" variant="solid">
            {formatName(status)}
          </Badge>
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
            current={currentWorkspace?.totalProjects ?? 0}
            label="Projects"
            max={currentWorkspace?.maxAllowedProjects ?? 1}
          />

          <TierLimitItem
            current={currentWorkspace?.totalMembers ?? 0}
            label="Members"
            max={currentWorkspace?.maxAllowedMembers ?? 1}
          />

          <TierLimitItem
            current={currentWorkspace?.totalIntegrations ?? 0}
            label="Integrations"
            max={currentWorkspace?.maxAllowedIntegrations ?? 1}
          />

          <TierLimitItem
            current={currentWorkspace?.totalRoles ?? 0}
            label="Roles"
            max={currentWorkspace?.maxAllowedRoles ?? 1}
          />
        </div>
      </DetailContainer>
      <DetailContainer>
        <div className="gap-1">
          <div className="flex items-center justify-between">
            <h3 className="mb-1 flex items-center gap-2 text-xl font-bold">
              {formatName(currentSubscription?.plan as string)} plan{' '}
              {renderSubscriptionStatusBadge(currentSubscription?.status)}
            </h3>
            <p>
              <span className="text-xl font-bold">{planPrice()}</span> per user
              / month
            </p>
          </div>
          <p className="text-sm text-neutral-300">
            More detail about the pricing and plan details.
          </p>
        </div>

        <Separator className="bg-white/20" />
        <div className="flex flex-col gap-5">
          <BillingDetailRow
            label="Seats"
            value={`x${currentSubscription?.seatsBooked || 0}`}
          />
          <BillingDetailRow
            label="Total Cost"
            value={`$${calculateTotalPrice()}`}
          />
          <BillingDetailRow
            label="Next Billing Date"
            value={
              dayjs(currentSubscription?.renewsOn).format('MMMM D, YYYY') ||
              'N/A'
            }
          />
          <BillingDetailRow
            label="Billing Cycle"
            value={currentSubscription?.isAnnual ? 'Annual' : 'Monthly'}
          />
        </div>
      </DetailContainer>
    </div>
  )
}
