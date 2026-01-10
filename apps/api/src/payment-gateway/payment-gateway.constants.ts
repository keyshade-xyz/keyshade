import { AllowedPlans } from './payment-gateway.types'

export const PLAN_NAME_MAP: Record<AllowedPlans, string> = {
  HACKER: 'Hacker',
  TEAM: 'Team'
}

export const MAX_SEAT_PER_PLAN: Record<AllowedPlans, number> = {
  HACKER: 10,
  TEAM: 30
}

export const PER_SEAT_PRICE: Record<
  AllowedPlans,
  {
    monthly: number
    annually: number
  }
> = {
  HACKER: {
    monthly: 9.99,
    annually: 7.99
  },
  TEAM: {
    monthly: 19.99,
    annually: 15.99
  }
}

export const PRODUCT_DESCRIPTION: Record<AllowedPlans, string> = {
  HACKER: 'Tailored plan for solo developers, freelancers and indie hackers',
  TEAM: 'Tailored plan for small teams, startups and companies'
}
