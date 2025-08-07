'use client'
import React, { useRef, useState } from 'react'
import { ArrowDownSVG } from '@public/svg/shared'
import Header from '@/components/billing/header'
import PlanCard from '@/components/billing/planCard'
import { Button } from '@/components/ui/button'
import ComparePlanList from '@/components/billing/comparePlanList'
import BillingFAQ from '@/components/billing/billingFAQ'

export default function NewBilling() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annually'>(
    'annually'
  )
  const comparePlanRef = useRef<HTMLDivElement>(null)
  const billingFAQRef = useRef<HTMLDivElement>(null)

  const TIERS = ['Hacker', 'Team', 'Enterprise'] as const

  const scrollToComparePlan = () => {
    comparePlanRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const scrollToBillingFAQ = () => {
    billingFAQRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }
  return (
    <div>
      <Header onTabChange={(value) => setSelectedPlan(value)} />
      <div className="mt-8 flex gap-x-7">
        {TIERS.map((tier) => (
          <PlanCard
            key={tier}
            onFeatureClick={() => {
              scrollToComparePlan()
            }}
            selectedPlan={selectedPlan}
            tierName={tier}
          />  
        ))}
      </div>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Button
          className="gap-2 px-9"
          onClick={scrollToBillingFAQ}
          variant="secondary"
        >
          FAQ&apos;s <ArrowDownSVG />
        </Button>
        <Button
          className="gap-2 px-9"
          onClick={scrollToComparePlan}
          variant="secondary"
        >
          Compare our plan <ArrowDownSVG />
        </Button>
      </div>
      <div className="mt-20" ref={comparePlanRef}>
        <ComparePlanList />
      </div>
      <div className="mt-20" ref={billingFAQRef}>
        <BillingFAQ />
      </div>
    </div>
  )
}
