import React from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface HeaderProps {
  onTabChange: (value: 'monthly' | 'annually') => void
}

export default function Header({ onTabChange }: HeaderProps) {
  return (
    <div className="flex flex-row justify-between">
      <div className="pt-4">
        <h1 className="text-2xl font-bold">Upgrade your plan</h1>
        <p className="mt-2.5 text-sm font-medium text-white/60">
          You&apos;re currently on the Free plan — upgrade to unlock more
          projects, users, and features.
        </p>
      </div>
      <Tabs defaultValue="annually">
        <TabsList>
          <TabsTrigger onClick={() => onTabChange('annually')} value="annually">
            Annually
          </TabsTrigger>
          <TabsTrigger onClick={() => onTabChange('monthly')} value="monthly">
            Monthly
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
