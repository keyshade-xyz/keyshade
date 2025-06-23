'use client'
import React from 'react'
import { KeyshadeBigSVG } from '@public/svg/auth'

function BillingPage(): React.JSX.Element {
  return (
    <main className="flex flex-col gap-y-10">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="mt-2.5 font-medium text-white/60">
          Manage your billing information and subscription details.
        </p>
      </div>

      <div className="flex w-full flex-col items-center justify-center rounded-lg border border-white/10 bg-neutral-900 py-10">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex items-center justify-center rounded-3xl border border-white/10 bg-neutral-800 p-2">
            <KeyshadeBigSVG size={60} />
          </div>
          <h3 className="text-lg font-semibold text-white/90">
            Keyshade is free for alpha testing
          </h3>
          <p className="text-secondary mt-3 max-w-md text-center text-sm text-white/55">
            During our alpha testing phase, all features are available at no
            cost. Billing information will be available once we launch our
            official pricing plans.
          </p>
        </div>
      </div>
    </main>
  )
}

export default BillingPage
