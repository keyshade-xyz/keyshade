interface PricingPlanFeatures {
  Workspace: string
  Projects: number | string
  Environments: number | string
  'Custom environments': boolean
  Secrets: number | string
  Variables: number | string
  'Secret Scanner': string
  'Integrations with 3rd-party services (like Vercel, AWS, etc)':
    | number
    | string
  'Version Control': string
  'Point in time recovery': boolean | number | string
  'Role-based Access Controls': boolean
  'Custom Roles': number | string
  WebHooks: boolean
  'Alerts (Discord, Slack, MS teams.)': boolean
  'Audit Logs': string
  SnapShots: boolean
  'Fork project': boolean
  'Configuration as code': boolean
  '2FA': boolean
  SDK: boolean
  API: boolean
  'IP white listing': boolean
  'Multi-role Assignment': string
  'Self hosting': boolean
  'Pre commit hook': boolean
  MCP: boolean
  Support: string
}

interface PricingPlans {
  Free: PricingPlanFeatures
  Hacker: PricingPlanFeatures
  Team: PricingPlanFeatures
  Enterprise: PricingPlanFeatures
}

export const PRICING_PLANS: PricingPlans = {
  Free: {
    Workspace: 'Unlimited',
    Projects: 5,
    Environments: 3,
    'Custom environments': false,
    Secrets: 15,
    Variables: 15,
    'Secret Scanner': 'Unlimited',
    'Integrations with 3rd-party services (like Vercel, AWS, etc)': 3,
    'Version Control': 'Last 5 visions',
    'Point in time recovery': false,
    'Role-based Access Controls': true,
    'Custom Roles': 5,
    WebHooks: true,
    'Alerts (Discord, Slack, MS teams.)': true,
    'Audit Logs': '7 days',
    SnapShots: false,
    'Fork project': true,
    'Configuration as code': true,
    '2FA': true,
    SDK: true,
    API: true,
    'IP white listing': false,
    'Multi-role Assignment': 'Unlimited',
    'Self hosting': true,
    'Pre commit hook': true,
    MCP: true,
    Support: 'Community Support (Discord and Reddit)'
  },
  Hacker: {
    Workspace: 'Unlimited',
    Projects: 10,
    Environments: 5,
    'Custom environments': true,
    Secrets: 30,
    Variables: 30,
    'Secret Scanner': 'Unlimited',
    'Integrations with 3rd-party services (like Vercel, AWS, etc)': 10,
    'Version Control': 'Last 20 visions',
    'Point in time recovery': 10,
    'Role-based Access Controls': true,
    'Custom Roles': 20,
    WebHooks: true,
    'Alerts (Discord, Slack, MS teams.)': true,
    'Audit Logs': '15 days',
    SnapShots: true,
    'Fork project': true,
    'Configuration as code': true,
    '2FA': true,
    SDK: true,
    API: true,
    'IP white listing': false,
    'Multi-role Assignment': 'Unlimited',
    'Self hosting': true,
    'Pre commit hook': true,
    MCP: true,
    Support: 'General support from internal team (email and chat)'
  },
  Team: {
    Workspace: 'Unlimited',
    Projects: 20,
    Environments: 'Unlimited',
    'Custom environments': true,
    Secrets: 100,
    Variables: 100,
    'Secret Scanner': 'Unlimited',
    'Integrations with 3rd-party services (like Vercel, AWS, etc)': 30,
    'Version Control': 'Last 50 visions',
    'Point in time recovery': 30,
    'Role-based Access Controls': true,
    'Custom Roles': 50,
    WebHooks: true,
    'Alerts (Discord, Slack, MS teams.)': true,
    'Audit Logs': '60 days',
    SnapShots: true,
    'Fork project': true,
    'Configuration as code': true,
    '2FA': true,
    SDK: true,
    API: true,
    'IP white listing': true,
    'Multi-role Assignment': 'Unlimited',
    'Self hosting': true,
    'Pre commit hook': true,
    MCP: true,
    Support: 'Dedicated point of contact'
  },
  Enterprise: {
    Workspace: 'Unlimited',
    Projects: 'Unlimited',
    Environments: 'Unlimited',
    'Custom environments': true,
    Secrets: 'Unlimited',
    Variables: 'Unlimited',
    'Secret Scanner': 'Unlimited',
    'Integrations with 3rd-party services (like Vercel, AWS, etc)': 'Unlimited',
    'Version Control': 'Last 50 visions',
    'Point in time recovery': 'Unlimited',
    'Role-based Access Controls': true,
    'Custom Roles': 'Unlimited',
    WebHooks: true,
    'Alerts (Discord, Slack, MS teams.)': true,
    'Audit Logs': '60 days',
    SnapShots: true,
    'Fork project': true,
    'Configuration as code': true,
    '2FA': true,
    SDK: true,
    API: true,
    'IP white listing': true,
    'Multi-role Assignment': 'Unlimited',
    'Self hosting': true,
    'Pre commit hook': true,
    MCP: true,
    Support: 'General support from internal team (email and chat)'
  }
}
