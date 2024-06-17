import type { PriceCardDataType, PriceTabDataType } from '@/types'

export const tabsData: PriceTabDataType = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly', tag: '-20%', special: true }
]

export const PriceCardsData: PriceCardDataType = [
  {
    title: 'Free',
    description:
      'For hobbyist developers looking to showcase their side projects.',
    price: 0,
    isPopular: false,
    spaceWorkspace: 2,
    spaceProjects: 3,
    spaceSecrets: 30,
    spaceEnvironment: 5,
    spaceIntegerations: 5,
    spaceAccessSpecifier: 'Only Public or Private',
    spaceUsers: 3,
    miscFeatures: [
      'Forking Allowed',
      'Event Monitoring',
      'Email Alerts',
      'Access Based Control',
      '5 Days Log Retention',
      'No IP Blacklisting',
      'No IP Whitelisting',
      'No Secret Auditing',
      'No Domain Mapping Support'
    ],
    spaceLiveSupport: false
  },
  {
    title: 'Personal',
    description:
      'For Power Users Shipping their ideas to become future products.',
    price: 9.99,
    isPopular: true,
    spaceWorkspace: 5,
    spaceProjects: 5,
    spaceSecrets: 50,
    spaceEnvironment: 10,
    spaceIntegerations: 10,
    spaceAccessSpecifier: 'All Types',
    spaceUsers: -1, // -1 => Unlimited
    miscFeatures: [
      'Forking Allowed',
      'Event Monitoring',
      'Email Alerts',
      'Access Based Control',
      '30 Days Log Retention',
      'No IP Blacklisting',
      'No IP Whitelisting',
      'No Secret Auditing',
      'No Domain Mapping Support'
    ],
    spaceLiveSupport: false
  },
  {
    title: 'Team',
    description: 'For professional teams shipping to production.',
    price: 19.99,
    isPopular: false,
    spaceWorkspace: 10,
    spaceProjects: -1,
    spaceSecrets: -1,
    spaceEnvironment: -1,
    spaceIntegerations: 20,
    spaceAccessSpecifier: 'All Types',
    spaceUsers: -1, // -1 => Unlimited
    miscFeatures: [
      'Forking Allowed',
      'Event Monitoring',
      'Email Alerts',
      'Access Based Control',
      '30 Days Log Retention',
      'Full IP Blacklisting',
      'Full IP Whitelisting',
      'Full Secret Auditing',
      'No Domain Mapping Support'
    ],
    spaceLiveSupport: false
  },
  {
    title: 'Enterprise',
    description: 'For large organizations with complex requirements.',
    price: -1, // -1 => Custom Pricing
    isPopular: false,
    spaceWorkspace: 5,
    spaceProjects: 5,
    spaceSecrets: 50,
    spaceEnvironment: 10,
    spaceIntegerations: 10,
    spaceAccessSpecifier: 'All Types',
    spaceUsers: -1, // -1 => Unlimited
    miscFeatures: [
      'Forking Allowed',
      'Event Monitoring',
      'Email Alerts',
      'Access Based Control',
      'Unlimited Log Retention',
      'IP Blacklisting',
      'IP Whitelisting',
      'Secret Auditing',
      'Domain Mapping Support'
    ],
    spaceLiveSupport: false
  }
]
