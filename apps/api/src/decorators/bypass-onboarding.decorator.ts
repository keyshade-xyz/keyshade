import { SetMetadata } from '@nestjs/common'

/**
 * There are some routes that we want the users to be able to access
 * even before they are done with the onboarding process. This decorator
 * is used to mark those routes.
 */

export const ONBOARDING_BYPASSED = 'onboarding_bypassed'
export const BypassOnboarding = () => SetMetadata(ONBOARDING_BYPASSED, true)
