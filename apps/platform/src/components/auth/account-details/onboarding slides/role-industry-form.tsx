import type { Dispatch, SetStateAction } from 'react'
import React, { useState } from 'react'
import { NunitoSansFont } from '@/fonts'
import type { OnboardingData } from '@/components/auth/account-details/onboarding-stepper'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

interface RoleIndustryFormProps {
  onboardingData: OnboardingData
  setOnboardingData: Dispatch<SetStateAction<OnboardingData>>
}

export default function RoleIndustryForm({
  onboardingData,
  setOnboardingData
}: RoleIndustryFormProps) {
  const { role, industry } = onboardingData
  const [isRoleOther, setIsRoleOther] = useState(
    role === 'Other' ||
      (role &&
        ![
          'Founder / Co-founder',
          'Developer / Engineer',
          'DevOps / SRE',
          'Student / Learner',
          'Product Manager'
        ].includes(role))
  )
  const [isIndustryOther, setIsIndustryOther] = useState(
    industry === 'Other' ||
      (industry &&
        !['SaaS', 'Fintech', 'E-commerce', 'Healthcare', 'Education'].includes(
          industry
        ))
  )

  const updateField = (field: keyof OnboardingData, value: string) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }))
  }

  const handleRoleChange = (value: string) => {
    if (value === 'Other') {
      setIsRoleOther(true)
      updateField('role', '')
    } else {
      setIsRoleOther(false)
      updateField('role', value)
    }
  }

  const handleIndustryChange = (value: string) => {
    if (value === 'Other') {
      setIsIndustryOther(true)
      updateField('industry', '')
    } else {
      setIsIndustryOther(false)
      updateField('industry', value)
    }
  }

  return (
    <div className="space-y-6">
      {/* User Role */}
      <div className="mx-auto md:w-[20vw]">
        <span
          className={`${NunitoSansFont.className} mb-2 flex flex-col items-start gap-2 text-sm`}
        >
          What best describes you?
        </span>
        <Select
          onValueChange={handleRoleChange}
          value={isRoleOther ? 'Other' : role}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Founder / Co-founder">
              Founder / Co-founder
            </SelectItem>
            <SelectItem value="Developer / Engineer">
              Developer / Engineer
            </SelectItem>
            <SelectItem value="DevOps / SRE">DevOps / SRE</SelectItem>
            <SelectItem value="Student / Learner">Student / Learner</SelectItem>
            <SelectItem value="Product Manager">Product Manager</SelectItem>
            <SelectItem value="Other">Other (please specify)</SelectItem>
          </SelectContent>
        </Select>
        {isRoleOther ? (
          <Input
            className="mt-2"
            onChange={(e) => updateField('role', e.target.value)}
            placeholder="Please specify your role"
            value={role}
          />
        ) : null}
      </div>

      {/* Industry Background */}
      <div className="mx-auto md:w-[20vw]">
        <span
          className={`${NunitoSansFont.className} mb-2 flex flex-col items-start gap-2 text-sm`}
        >
          What industry are you in?
        </span>
        <Select
          onValueChange={handleIndustryChange}
          value={isIndustryOther ? 'Other' : industry}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select industry" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SaaS">SaaS</SelectItem>
            <SelectItem value="Fintech">Fintech</SelectItem>
            <SelectItem value="E-commerce">E-commerce</SelectItem>
            <SelectItem value="Healthcare">Healthcare</SelectItem>
            <SelectItem value="Education">Education</SelectItem>
            <SelectItem value="Other">Other (please specify)</SelectItem>
          </SelectContent>
        </Select>
        {isIndustryOther ? (
          <Input
            className="mt-2"
            onChange={(e) => updateField('industry', e.target.value)}
            placeholder="Please specify your industry"
            value={industry}
          />
        ) : null}
      </div>
    </div>
  )
}
