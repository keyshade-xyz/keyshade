'use client'

import React, { useState } from 'react'
import type { Integration } from '@keyshade/schema'
import { Button } from '@/components/ui/button'
import ControllerInstance from '@/lib/controller-instance'
import { toast } from 'sonner'
import { SpinnerSVG } from '@public/svg/shared'

interface CheckConfigurationProps {
  selectedIntegration: Integration
}

function CheckConfiguration({ selectedIntegration }: CheckConfigurationProps) {
  const [isVerifying, setIsVerifying] = useState<boolean>(false)

  const handleVerify = async () => {
    setIsVerifying(true)
    const loadingToastId = toast.loading('Checking integration configuration...')
    try {
      const { data, error, success } =
        await ControllerInstance.getInstance().integrationController.verifyIntegration(
          { integrationSlug: selectedIntegration.slug }
        )

      toast.dismiss(loadingToastId)
      if (success && data?.success) {
        toast.success(
          data.message || 'Integration configuration verified successfully!'
        )
      } else {
        toast.error(
          error?.message ||
            'Failed to verify integration configuration. Please check your credentials.'
        )
      }
    } catch (err: any) {
      toast.dismiss(loadingToastId)
      toast.error(
        err?.message || 'An unexpected error occurred during verification.'
      )
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
      <div className="mr-4 flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-white">Check Configurations</h2>
        <p className="text-sm text-white/60">
          Verify that the configured credentials and integration settings can
          successfully reach the connected provider.
        </p>
      </div>
      <Button
        variant="secondary"
        onClick={handleVerify}
        disabled={isVerifying}
        className="shrink-0"
      >
        {isVerifying ? (
          <div className="flex items-center gap-2">
            <SpinnerSVG className="h-4 w-4 animate-spin text-white" />
            <span>Checking...</span>
          </div>
        ) : (
          'Check Configurations'
        )}
      </Button>
    </div>
  )
}

export default CheckConfiguration
