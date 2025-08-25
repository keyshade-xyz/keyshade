export type AllowedPlans = 'HACKER' | 'TEAM'

export interface PaymentHistory {
  items: {
    amount: number
    date: Date
    plan: AllowedPlans
    status: string
    seats: string
    paid: boolean
    currency: string
    orderId: string
    name: string
  }[]
  metadata: {
    totalCount: number
    lastPage: number
  }
}

export interface Invoice {
  url: string
}

export interface PaymentLinkMetadata {
  workspaceId: string
  plan: AllowedPlans
  seats: number
  isAnnual: boolean
  paymentLinkId: string
}

export interface ProductMetadata {
  plan: AllowedPlans
  seats: number
  isAnnual: boolean
}

export type SubscriptionCancellationReason =
  | 'too_expensive'
  | 'missing_features'
  | 'switched_service'
  | 'unused'
  | 'customer_service'
  | 'low_quality'
  | 'too_complex'
  | 'other'
