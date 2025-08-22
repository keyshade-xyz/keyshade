import React, { useState } from 'react'
import { EnterpriseSVG, HackerSVG, TeamSVG } from 'public/svg/billing'
import { useAtomValue } from 'jotai'
import type { AllowedPlans } from '@keyshade/schema'
import { toast } from 'sonner'
import Visible from '@/components/common/visible'
import { Slider } from '@/components/ui/slider'
import {
  MaxSeatPerTier,
  PricingTiers,
  TierDescription
} from '@/constants/billing/planCard'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'
import { Button } from '@/components/ui/button'

export interface PlanCardProps {
  selectedPlan: 'monthly' | 'annually'
  tierName: 'Hacker' | 'Team' | 'Enterprise'
  onFeatureClick?: (feature: string) => void
}

function renderIcon(tierName: PlanCardProps['tierName']) {
  switch (tierName) {
    case 'Hacker':
      return <HackerSVG />
    case 'Team':
      return <TeamSVG />
    case 'Enterprise':
      return <EnterpriseSVG />
  }
}

const DEFAULT_SEAT_VALUE = 1

export default function PlanCard({
  selectedPlan,
  tierName,
  onFeatureClick
}: PlanCardProps) {
  const [seats, setSeats] = useState<number>(DEFAULT_SEAT_VALUE)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)

  const NO_SEATS_SELECTED = seats === 0

  const isAnually = selectedPlan === 'annually'

  const planName = (): AllowedPlans | null => {
    if (tierName === 'Hacker') {
      return 'HACKER'
    }
    if (tierName === 'Team') {
      return 'TEAM'
    }
    return null
  }

  const calculateTotalPrice = () => {
    if (tierName === 'Enterprise') {
      return 'Custom Plan'
    }

    const priceString = PricingTiers[tierName][selectedPlan]
    const price = parseFloat(priceString.replace('$', ''))
    const totalPrice = price * seats

    return `$${totalPrice.toFixed(2)}`
  }

  const getBasePrice = () => {
    return PricingTiers[tierName][selectedPlan]
  }

  const generatePaymentLink = useHttp(() =>
    ControllerInstance.getInstance().paymentController.generatePaymentLink({
      isAnnual: isAnually,
      seats,
      workspaceSlug: currentWorkspace?.slug ?? '',
      plan: planName()!
    })
  )

  const redirectToPayment = () => {
    if (tierName === 'Enterprise') {
      window.location.href =
        'mailto:contact@keyshade.xyz?subject=Enterprise Plan Inquiry&body=Hi, I am interested in the Enterprise plan for my organization.'
      return
    }
    setIsLoading(true)

    generatePaymentLink()
      .then(({ data, success, error }) => {
        if (success && data) {
          toast.success('Payment link generated successfully!', {
            description: (
              <p className="text-xs text-green-300">
                Redirecting to payment...
              </p>
            )
          })
          window.location.href = data.link
        } else {
          toast.error('Error generating payment link', {
            description: (
              <p className="text-xs text-red-300">
                {error?.message || 'Please try again later.'}
              </p>
            )
          })
        }
      })
      .catch((err) => {
        toast.error('Unexpected error occurred', {
          description: (
            <p className="text-xs text-red-300">
              {err?.message || 'Please try again later.'}
            </p>
          )
        })
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const isNotEnterprise = tierName !== 'Enterprise'
  const totalPrice = calculateTotalPrice()
  const basePrice = getBasePrice()
  const showTotalCalculation = isNotEnterprise && seats > 1

  return (
    <div className=" w-full  rounded-[28px] bg-white/5 px-1 py-1 shadow-lg">
      <div className="flex h-full w-full flex-col justify-between rounded-[23px] bg-gradient-to-br from-black/80 via-white/5 to-transparent p-5">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {renderIcon(tierName)}{' '}
              <span className="font-medium">{tierName}</span>
            </div>
            <button
              className="rounded-md bg-[#3F3F3F] px-2 py-1 text-xs font-medium"
              onClick={() => {
                if (onFeatureClick) {
                  onFeatureClick(tierName)
                }
              }}
              type="button"
            >
              See all features
            </button>
          </div>
          <div className="mt-4">
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-4xl font-semibold">
                  {showTotalCalculation ? totalPrice : basePrice}
                </span>{' '}
                <Visible if={isNotEnterprise}>
                  <span className="text-sm text-neutral-300">/month</span>
                </Visible>
              </div>
            </div>
            <div className="mt-3 max-w-[318px] text-sm text-neutral-300">
              {TierDescription[tierName]}
            </div>
          </div>
          <Visible if={isNotEnterprise}>
            <div className="mt-5">
              <Slider
                defaultValue={[DEFAULT_SEAT_VALUE]}
                max={MaxSeatPerTier[tierName]}
                min={1}
                onValueChange={(value) => setSeats(value[0])}
                step={1}
              />
              <div className="mt-1 text-sm text-neutral-300">
                {' '}
                {seats}/{MaxSeatPerTier[tierName]} seats
              </div>
            </div>
          </Visible>
        </div>

        <Button
          className="mt-5 h-fit bg-white text-[#09090B] shadow-[inset_0_2px_2px_rgba(0,0,0,0.2)] disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-[#09090B]/80"
          disabled={NO_SEATS_SELECTED || isLoading}
          onClick={redirectToPayment}
          type="button"
          variant="secondary"
        >
          {isLoading ? 'Generating payment link...' : 'Continue to payment'}
        </Button>
      </div>
    </div>
  )
}
