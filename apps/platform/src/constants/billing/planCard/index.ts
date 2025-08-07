import type { PlanCardProps } from "@/components/billing/planCard";

export const PricingTiers: Record<
  PlanCardProps['tierName'],
  Record<PlanCardProps['selectedPlan'], string>
> = {
  Hacker: {
	monthly: '$9.99',
	annually: '$7.99'
  },
  Team: {
	monthly: '$19.99',
	annually: '$15.99'
  },
  Enterprise: {
	monthly: 'Custom Plan',
	annually: 'Custom Plan'
  }
}

export const TierDescription: Record<PlanCardProps['tierName'], string> = {
  Hacker: 'For power users shipping their ideas to become future products.',
  Team: 'For small startups who are scaling fast.',
  Enterprise:
	'For big corporate to manage their secrets and variables across different teams efficiently.'
}

export const MaxSeatPerTier: Record<PlanCardProps['tierName'], number> = {
  Hacker: 10,
  Team: 40,
  Enterprise: 100000000000000 // effectively unlimited
}