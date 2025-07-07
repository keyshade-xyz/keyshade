export interface PriceCardPropsType {
  title: string
  description: string
  price: number
  yearlyPrice?: number

  isPopular: boolean
  spaceProjects: number
  spaceEnvironment: number
  spaceSecrets: number
  spaceVariables: number
  versionControl: number
  auditlogs: number
  spaceIntegerations: number
  spaceLiveSupport: string

  customRoles: number

  snapshots: number

  spaceAccessSpecifier: string

  spaceUsers: number

  miscFeatures: string[]
  PricingType?: string
}

export interface PriceTabPropsType {
  id: string
  label: string
  tag?: string
  special?: boolean
  default?: boolean
}

export type PriceTabDataType = PriceTabPropsType[]
export type PriceCardDataType = PriceCardPropsType[]
