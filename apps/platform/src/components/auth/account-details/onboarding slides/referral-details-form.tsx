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

interface ReferralDetailsFormProps {
  onboardingData: OnboardingData
  setOnboardingData: Dispatch<SetStateAction<OnboardingData>>
}

export default function ReferralForm({
  onboardingData,
  setOnboardingData
}: ReferralDetailsFormProps) {
  const { promotion, referral } = onboardingData

  const [isPromotionOther, setIsPromotionOther] = useState(
    promotion === 'Other' ||
      (promotion &&
        ![
          'GitHub',
          'Twitter / X',
          'LinkedIn',
          'Reddit',
          'Word of mouth',
          'Google Search'
        ].includes(promotion))
  )

  const updateField = (field: keyof OnboardingData, value: string) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }))
  }

  const handlePromotionChange = (value: string) => {
    if (value === 'Other') {
      setIsPromotionOther(true)
      updateField('promotion', '')
    } else {
      setIsPromotionOther(false)
      updateField('promotion', value)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mx-auto md:w-[20vw]">
        <span
          className={`${NunitoSansFont.className} mb-2 flex flex-col items-start gap-2 text-sm`}
        >
          Where did you hear about Keyshade?
        </span>
        <Select
          onValueChange={handlePromotionChange}
          value={isPromotionOther ? 'Other' : promotion || ''}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GitHub">GitHub</SelectItem>
            <SelectItem value="Twitter / X">Twitter / X</SelectItem>
            <SelectItem value="LinkedIn">LinkedIn</SelectItem>
            <SelectItem value="Reddit">Reddit</SelectItem>
            <SelectItem value="Word of mouth">Word of mouth</SelectItem>
            <SelectItem value="Google Search">Google Search</SelectItem>
            <SelectItem value="Other">Other (please specify)</SelectItem>
          </SelectContent>
        </Select>
        {isPromotionOther ? (
          <Input
            className="mt-2"
            onChange={(e) => updateField('promotion', e.target.value)}
            placeholder="Please specify"
            value={promotion || ''}
          />
        ) : null}
      </div>
      <div className="mx-auto space-y-4 md:w-[20vw]">
        <label
          className={`${NunitoSansFont.className} flex flex-col items-start gap-2 text-sm`}
          htmlFor="referral-input"
        >
          Referral Code (if any)
          <Input
            id="referral-input"
            onChange={(e) => updateField('referral', e.target.value)}
            placeholder="Enter referral code"
            value={referral || ''}
          />
        </label>
      </div>
    </div>
  )
}
