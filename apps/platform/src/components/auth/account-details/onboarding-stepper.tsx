import React, { useState } from 'react'
import { useAtom } from 'jotai'
import { LoadingSVG } from '@public/svg/shared'
import Cookies from 'js-cookie'
import { toast } from 'sonner'
import { posthog } from 'posthog-js'
import { z } from 'zod'
import ProfileDetailsForm from './onboarding slides/profile-details-form'
import ReferralDetailsForm from './onboarding slides/referral-details-form'
import RoleIndustryForm from './onboarding slides/role-industry-form'
import TeamOverviewForm from './onboarding slides/team-overview-form'
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
  imageurl?: string
  referral?: string
  role?: string
  background?: string
  teamSize?: string
  stage?: string
  useCase?: string
  promotion?: string
}

export default function OnboardingStepper() {
  const [user, setUser] = useAtom(userAtom)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)

  const [data, setData] = useState<OnboardingData>({
    name: user?.name || '',
    imageurl: user?.profilePictureUrl || ''
  })

  const finishOnboarding = useHttp(() =>
    ControllerInstance.getInstance().userController.finishOnboarding({
      name: data.name,
      profilePictureUrl: data.imageurl,
      role: data.role,
      industry: data.background,
      teamSize: data.teamSize,
      productStage: data.stage,
      useCase: data.useCase,
      heardFrom: data.promotion,
      referralCode: data.referral
    })
  )

  const handleNext = () => {
    if (currentStep === 1) {
      try {
        nameSchema.parse(data.name)
      } catch (e) {
        toast.error((e as z.ZodError).errors[0].message)
        return
      }
    }
    setCurrentStep((prev) => Math.min(totalSteps, prev + 1))
  }

  const handleSubmit = async () => {
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

        <div className="mt-6 flex justify-end gap-2">
          <Button
            className="text-sm"
            disabled={isLoading}
            onClick={handleSubmit}
            variant="outline"
          >
            Skip
          </Button>

          <div className="flex gap-4">
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
        </div>
      </div>
    </div>
  )
}
