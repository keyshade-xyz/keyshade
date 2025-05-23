import {
  SecretSVG,
  VariableSVG,
  EnvironmentSVG,
  FolderSVG
} from '@public/svg/dashboard'

export const TAB_CONFIGS = {
	settings: [
	  { id: 'profile', label: 'Profile' },
	  { id: 'billing', label: 'Billing' },
	  { id: 'invites', label: 'Invites' }
	],
	project: [
	  { id: 'overview', label: 'Overview', icon: <FolderSVG /> },
	  { id: 'secret', label: 'Secret', icon: <SecretSVG /> },
	  { id: 'variable', label: 'Variable', icon: <VariableSVG /> },
	  { id: 'environment', label: 'Environment', icon: <EnvironmentSVG /> }
	],
	// members: [
	//   { id: 'joined', label: 'Joined' },
	//   { id: 'invited', label: 'Invited' }
	// ]
  }