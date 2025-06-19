import type { Dispatch, SetStateAction } from 'react'
import React, { useRef } from 'react'
import { Camera, User } from 'lucide-react'
import Image from 'next/image'
import { NunitoSansFont } from '@/fonts'
import { Input } from '@/components/ui/input'
import type { OnboardingData } from '@/components/auth/account-details/onboarding-stepper'

interface ProfileDetailsFormProps {
  onboardingData: OnboardingData
  setOnboardingData: Dispatch<SetStateAction<OnboardingData>>
}

export default function ProfileDetailsForm({
  onboardingData,
  setOnboardingData
}: ProfileDetailsFormProps) {
  const { name, profilePictureUrl } = onboardingData
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateField = (field: keyof OnboardingData, value: string) => {
    setOnboardingData((prev) => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        updateField('profilePictureUrl', result)
      }
      reader.readAsDataURL(file)
    }
  }
  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/10 bg-neutral-800 shadow-lg transition-all duration-200 hover:shadow-xl">
            {profilePictureUrl ? (
              <div className="relative h-full w-full">
                <Image
                  alt="Profile"
                  className="h-full w-full object-cover"
                  fill
                  src={profilePictureUrl}
                />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-8 w-8 text-white/20" />
              </div>
            )}
          </div>

          <button
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-600 text-white shadow-lg transition-all duration-200 hover:scale-110 hover:bg-neutral-700"
            onClick={triggerFileInput}
            type="button"
          >
            <Camera size={14} />
          </button>
        </div>

        <input
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          ref={fileInputRef}
          type="file"
        />
      </div>
      <div className="mx-auto space-y-4 md:w-[20vw]">
        <label
          className={`${NunitoSansFont.className} flex flex-col items-start gap-2 text-sm`}
          htmlFor="name-input"
        >
          Your Name
          <Input
            id="name-input"
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Enter your name"
            value={name}
          />
        </label>
      </div>
    </div>
  )
}
