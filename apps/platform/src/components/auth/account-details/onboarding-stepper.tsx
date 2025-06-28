import React, { useState } from 'react'
import { useAtom } from 'jotai'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { posthog } from 'posthog-js'
import { z } from 'zod'
import { LoadingSVG } from '@public/svg/shared'
import TeamOverviewForm from './onboarding slides/team-overview-form'
import RoleIndustryForm from './onboarding slides/role-industry-form'
import ProfileDetailsForm from './onboarding slides/profile-details-form'
import ReferralDetailsForm from './onboarding slides/referral-details-form'
import { userAtom } from '@/store'
import { Button } from '@/components/ui/button'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger
} from '@/components/ui/stepper'

const nameSchema = z.string().trim().min(1, 'Name is required')
const totalSteps = 4

export interface OnboardingData {
  name: string
  profilePictureUrl?: string
  referralCode?: string
  role?: string
  industry?: string
  teamSize?: string
  productStage?: string
  useCase?: string
  heardFrom?: string
}

export default function OnboardingStepper() {
  const [user, setUser] = useAtom(userAtom)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    name: user?.name || '',
    profilePictureUrl: user?.profilePictureUrl || ''
  })

  const finishOnboarding = useHttp(() =>
    ControllerInstance.getInstance().userController.finishOnboarding({
      name: data.name,
      //  profilePictureUrl: data.profilePictureUrl,
      role: data.role,
      industry: data.industry,
      teamSize: data.teamSize,
      productStage: data.productStage,
      useCase: data.useCase,
      heardFrom: data.heardFrom,
      referralCode: data.referralCode
    })
  )

  const validateName = (): boolean => {
    try {
      nameSchema.parse(data.name)
      return true
    } catch (e) {
      toast.error((e as z.ZodError).errors[0].message)
      return false
    }
  }

  const handleNext = () => {
    if (currentStep === 1 && !validateName()) {
      return
    }
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1))
  }

  const handleSubmit = async () => {
    if (!validateName()) return
    setIsLoading(true)
    toast.loading('Updating profile details...')
    try {
      const { success, data: updated } = await finishOnboarding()
      if (success && updated) {
        Cookies.set('isOnboardingFinished', 'true')
        setUser(updated)
        posthog.identify()
        window.location.href = '/'
      }
    } finally {
      toast.dismiss()
      setIsLoading(false)
    }
  }

  const renderStep = () => {
    const props = { onboardingData: data, setOnboardingData: setData }
    switch (currentStep) {
      case 1:
        return <ProfileDetailsForm {...props} />
      case 2:
        return <RoleIndustryForm {...props} />
      case 3:
        return <TeamOverviewForm {...props} />
      case 4:
        return <ReferralDetailsForm {...props} />
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-8 text-center">
      <Stepper
        className="flex justify-between rounded-xl"
        onValueChange={setCurrentStep}
        value={currentStep}
      >
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <StepperItem className="ml-0 " key={step} step={step}>
            <StepperTrigger>
              <StepperIndicator />
            </StepperTrigger>
            {step < totalSteps && <StepperSeparator />}
          </StepperItem>
        ))}
      </Stepper>

      <div className=" flex flex-col gap-4 rounded-xl bg-[#191A1C] p-8">
        {renderStep()}

        <div className="mt-6 flex flex-col justify-end gap-2">
          <div className="flex gap-6">
            <Button
              className="flex-1"
              disabled={isLoading}
              onClick={currentStep === totalSteps ? handleSubmit : handleNext}
              variant="secondary"
            >
              {isLoading ? (
                <LoadingSVG className="w-6" />
              ) : currentStep === totalSteps ? (
                'Finish'
              ) : (
                'Next'
              )}
            </Button>
          </div>
          <Button
            className="border-white/60 text-sm text-white/60"
            disabled={isLoading}
            onClick={handleSubmit}
            variant="outline"
          >
            Skip
          </Button>
        </div>
      </div>
    </div>
  )
}
