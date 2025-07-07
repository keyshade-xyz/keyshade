import type { PriceCardDataType, PriceTabDataType } from '@/types'

export const tabsData: PriceTabDataType = [
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly', tag: '-20%', special: true, default: true }
]

export const PriceCardsData: PriceCardDataType = [
  {
    title: 'Free',
    description:
      'For hobbyist developers looking to showcase their side projects.',
    price: 0,
    isPopular: false,
    spaceProjects: 5,
    spaceSecrets: 15,
    spaceVariables: 15,
    versionControl: 5,
    snapshots: 0,
    spaceEnvironment: 3,
    spaceIntegerations: 3,
    spaceAccessSpecifier: 'Only Public or Private',
    auditlogs: 7,
    spaceUsers: 3,
    customRoles: 5,
    miscFeatures: [
      'Custom Environments Allowed',
      'Secret Scanner',
      'Role Based Access Control',
      'Webhooks Allowed',
      'Alerts (Discord, Slack, MS teams.)',
      'Forking Allowed',
      'Configuration as Code',
      '2FA Authentication',
      'SDK Support',
      'API Access',
      'Multirole Assignments',
      'Self Hosting',
      'Pre commit Hooks',
      'MCP Support',
      'No IP Blacklisting',
      'No IP Whitelisting'
    ],
    spaceLiveSupport: 'Community Support (Discord and Reddit)'
  },
  {
    title: 'Hacker',
    description:
      'For Power Users Shipping their ideas to become future products.',
    price: 9.99,
    yearlyPrice: 7.99,
    isPopular: false,
    spaceProjects: 10,
    spaceSecrets: 30,
    spaceVariables: 30,
    versionControl: 20,
    snapshots: 10,
    spaceEnvironment: 5,
    spaceIntegerations: 10,
    spaceAccessSpecifier: 'All Types of',
    auditlogs: 15,
    spaceUsers: 10, // -1 => Unlimited
    customRoles: 20,
    miscFeatures: [
      'Custom Environments Allowed',
      'Secret Scanner',
      'Role Based Access Control',
      'Webhooks Allowed',
      'Alerts (Discord, Slack, MS teams.)',
      'Configuration as Code',
      '2FA Authentication',
      'SDK Support',
      'API Access',
      'Multirole Assignments',
      'Self Hosting',
      'Pre commit Hooks',
      'MCP Support',
      'Forking Allowed',
      'Event Monitoring',
      'Access Based Control',
      'No IP Blacklisting',
      'No IP Whitelisting'
    ],
    spaceLiveSupport: 'General support from internal team'
  },
  {
    title: 'Team',
    description: 'For professional teams shipping to production.',
    price: 19.99,
    yearlyPrice: 15.99,
    isPopular: true,
    spaceProjects: -1,
    spaceSecrets: 100,
    spaceVariables: 100,
    versionControl: 50,
    snapshots: 30,
    spaceEnvironment: -1,
    spaceIntegerations: 30,
    auditlogs: 60,
    spaceAccessSpecifier: 'All Types of',
    spaceUsers: 40, // -1 => Unlimited
    customRoles: 50,
    miscFeatures: [
      'Custom Environments Allowed',
      'Secret Scanner',
      'Role Based Access Control',
      'Webhooks Allowed',
      'Alerts (Discord, Slack, MS teams.)',
      'Configuration as Code',
      '2FA Authentication',
      'SDK Support',
      'API Access',
      'Multirole Assignments',
      'Self Hosting',
      'Pre commit Hooks',
      'MCP Support',
      'Forking Allowed',
      'Event Monitoring',
      'Access Based Control',
      'Full IP Blacklisting',
      'Full IP Whitelisting'
    ],
    spaceLiveSupport: 'Dedicated point of contact for support'
  },
  {
    title: 'Enterprise',
    description: 'For large organizations with complex requirements.',
    price: -1, // -1 => Custom Pricing
    isPopular: false,
    spaceProjects: -1,
    spaceSecrets: -1,
    spaceVariables: -1,
    versionControl: -1, // -1 => Unlimited
    snapshots: -1, // -1 => Unlimited
    auditlogs: -1, // -1 => Unlimited
    spaceEnvironment: -1,
    spaceIntegerations: -1,
    spaceAccessSpecifier: 'All Types of',
    spaceUsers: -1, // -1 => Unlimited
    customRoles: -1,
    miscFeatures: [
      'Custom Environments Allowed',
      'Secret Scanner',
      'Role Based Access Control',
      'Webhooks Allowed',
      'Alerts (Discord, Slack, MS teams.)',
      'Configuration as Code',
      '2FA Authentication',
      'SDK Support',
      'API Access',
      'Multirole Assignments',
      'Self Hosting',
      'Pre commit Hooks',
      'MCP Support',
      'Forking Allowed',
      'Event Monitoring',
      'Access Based Control',
      'Full IP Whitelisting',
      'Full Secret Auditing'
    ],
    spaceLiveSupport:
      'Community, Email, Onboarding Support, Dedicated Customer Success Engineer, 24/7 Live Support'
  }
]
