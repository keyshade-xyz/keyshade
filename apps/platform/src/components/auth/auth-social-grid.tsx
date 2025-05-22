import React from 'react'
import { Button } from '../ui/button'
import { OAUTH_PROVIDER } from '@/constants/auth/auth-index'

/**
 * A component that displays a grid of social login buttons for OAuth providers.
 * Each button redirects to the corresponding OAuth provider's login URL.
 */
export default function AuthSocialGrid() {
  return (
    <div className="grid grid-cols-3 gap-x-6">
      {OAUTH_PROVIDER.map((provider) => {
        return (
          <Button
            key={provider.name}
            onClick={() => (window.location.href = provider.url)}
          >
            {provider.icon}
          </Button>
        )
      })}
    </div>
  )
}
