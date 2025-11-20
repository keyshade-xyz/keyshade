import {
  SecretSVG,
  VariableSVG,
  EnvironmentSVG,
  SettingsSVG
} from '@public/svg/dashboard'

export const TAB_CONFIGS = {
  settings: [
    { id: 'profile', label: 'Profile' },
    // { id: 'billing', label: 'Billing' },
    { id: 'invites', label: 'Invites' }
  ],
  project: [
    { id: 'secrets', label: 'Secrets', icon: <SecretSVG /> },
    { id: 'variables', label: 'Variables', icon: <VariableSVG /> },
    { id: 'environment', label: 'Environment', icon: <EnvironmentSVG /> },
    // { id: 'log', label: 'Log', icon: <EnvironmentSVG /> }, // TODO: Need to add it later
    { id: 'settings', label: 'Settings', icon: <SettingsSVG /> }
  ],
  members: [
    { id: 'joined', label: 'Joined' },
    { id: 'invited', label: 'Invited' }
  ],
  integrations: [
    { id: 'overview', label: 'Overview' },
    { id: 'all', label: 'All Integrations', route: 'all' }
  ]
}
