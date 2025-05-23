import React from 'react'

export default function AuthTnC() {
  return (
    <div className="text-center text-xs text-[#808080]">
      By continuing, you acknowledge and agree to our <br />
      <a
        className="underline"
        href="https://keyshade.xyz/terms_and_condition"
        rel="noopener noreferrer"
        target="_blank"
      >
        Legal Terms
      </a>{' '}
      and{' '}
      <a
        className="underline"
        href="https://keyshade.xyz/privacy"
        rel="noopener noreferrer"
        target="_blank"
      >
        Privacy Policy
      </a>{' '}
      .
    </div>
  )
}
