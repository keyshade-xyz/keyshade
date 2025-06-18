import type { Dispatch, SetStateAction } from 'react'
import React from 'react'
import { NunitoSansFont } from '@/fonts'
import type { OnboardingData } from '@/components/auth/account-details/onboarding-stepper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface TeamOverviewFormProps {
  onboardingData: OnboardingData
  setOnboardingData: Dispatch<SetStateAction<OnboardingData>>
}

export default function TeamOverviewForm({
  onboardingData,
  setOnboardingData
}: TeamOverviewFormProps) {
  const { teamSize, stage, useCase } = onboardingData

  const updateField = (field: keyof OnboardingData, value: string) => {
    setOnboardingData((prev: OnboardingData) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Team Size */}
      <div className="mx-auto md:w-[20vw]">
        <span
          className={`${NunitoSansFont.className} mb-2 flex flex-col items-start gap-2 text-sm`}
        >
          What size is your company/team?
        </span>
        <Select
          onValueChange={(value) => updateField('teamSize', value)}
          value={teamSize || ''}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select team size" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Solo">Solo</SelectItem>
            <SelectItem value="Startup (1-10)">Startup (1-10)</SelectItem>
            <SelectItem value="Small business (11-50)">
              Small business (11-50)
            </SelectItem>
            <SelectItem value="Mid-sized (51-200)">
              Mid-sized (51-200)
            </SelectItem>
            <SelectItem value="Enterprise (200+)">Enterprise (200+)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Current Stage */}
      <div className="mx-auto md:w-[20vw]">
        <span
          className={`${NunitoSansFont.className} mb-2 flex flex-col items-start gap-2 text-sm`}
        >
          What is your current stage?
        </span>
        <Select
          onValueChange={(value) => updateField('stage', value)}
          value={stage || ''}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Idea">Idea</SelectItem>
            <SelectItem value="MVP">MVP</SelectItem>
            <SelectItem value="In production">In production</SelectItem>
            <SelectItem value="Scaling">Scaling</SelectItem>
            <SelectItem value="Enterprise-grade">Enterprise-grade</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Use case */}
      <div className="mx-auto md:w-[20vw]">
        <span
          className={`${NunitoSansFont.className} mb-2 flex flex-col items-start gap-2 text-sm`}
        >
          What are you planning to use Keyshade for?
        </span>
        <Select
          onValueChange={(value) => updateField('useCase', value)}
          value={useCase || ''}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Usecase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Managing secrets in a project">
              Managing secrets in a project
            </SelectItem>
            <SelectItem value="Team-wide config management">
              Team-wide config management
            </SelectItem>
            <SelectItem value="DevOps/CI pipeline integration">
              DevOps/CI pipeline integration
            </SelectItem>
            <SelectItem value="Learning/testing the tool">
              Learning/testing the tool
            </SelectItem>
            <SelectItem value="Not sure yet">Not sure yet</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
