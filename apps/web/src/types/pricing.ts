export interface PriceCardPropsType {
  title: string
  description: string
  price: number

  isPopular: boolean

  spaceWorkspace: number
  spaceProjects: number
  spaceEnvironment: number
  spaceSecrets: number
  spaceIntegerations: number
  spaceLiveSupport: boolean

  spaceAccessSpecifier: string

  spaceUsers: number

  miscFeatures: string[]
}

export interface PriceTabPropsType {
  id: string
  label: string
  tag?: string
  special?: boolean
}

export type PriceTabDataType = PriceTabPropsType[]
export type PriceCardDataType = PriceCardPropsType[]
