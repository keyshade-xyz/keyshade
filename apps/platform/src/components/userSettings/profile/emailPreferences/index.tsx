import { useAtom } from 'jotai'
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { userAtom } from '@/store'

interface EmailPreference {
  marketing: boolean
  activity: boolean
  critical: boolean
}

const emailPreferencesData = [
  {
    id: 'marketing',
    label: 'Receive news about product updates'
  },
  {
    id: 'activity',
    label:
      'Receive updates about your workspaces and app specific events'
  },
  {
    id: 'critical',
    label: 'Receive time specific or critical updates'
  }
]

function EmailPreferences(): React.JSX.Element {
  const [user, setUser] = useAtom(userAtom)

  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [emailPreferences, setEmailPreferences] = useState<EmailPreference>()

  const updateSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.updateSelf({
      emailPreferences: {
        marketing: emailPreferences?.marketing ?? true,
        activity: emailPreferences?.activity ?? true,
        critical: emailPreferences?.critical ?? true
      }
    })
  )

  const handleUpdateEmailPreference = (
    key: keyof EmailPreference,
    checked: boolean
  ) => {
    if (!emailPreferences) return

    const updatedPreferences = {
      ...emailPreferences,
      [key]: checked
    }
    setEmailPreferences(updatedPreferences)
  }

  const handleUpdateUserEmailPreference = async () => {
    toast.loading('Updating email preferences...')
    setIsLoading(true)

    try {
      const { success, data } = await updateSelf()

      if (success && data) {
        toast.success('Email preferences updated successfully!')
        setUser(data)
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }

  useEffect(() => {
    setEmailPreferences(user?.emailPreference)
  }, [user?.emailPreference])

  return (
    <div>
      <h2 className="text-xl font-semibold">Email Preferences</h2>
      <div className="my-7 flex flex-col gap-6">
        {emailPreferencesData.map((emailPreference) => (
          <div className="flex gap-2" key={emailPreference.id}>
            <Checkbox
              checked={emailPreferences?.[emailPreference.id]}
              className="rounded-[4px] border border-[#18181B] bg-[#71717A] data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
              id={emailPreference.id}
              name={emailPreference.id}
              onCheckedChange={(checked) =>
                handleUpdateEmailPreference(
                  emailPreference.id as keyof EmailPreference,
                  Boolean(checked)
                )
              }
            />
            <Label htmlFor={emailPreference.id}>
              <div className='flex flex-col gap-4'>
                <p className='capitalize'>{emailPreference.id}</p>
                <p className='text-white/70'>{emailPreference.label}</p>
              </div>
            </Label>
          </div>
        ))}
      </div>
      <Button
        disabled={isLoading}
        onClick={handleUpdateUserEmailPreference}
        variant="secondary"
      >
        Save Changes
      </Button>
    </div>
  )
}

export default EmailPreferences
