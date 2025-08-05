'use client'
import React from 'react'
import { useAtomValue } from 'jotai'
import {
  CardSVG,
  DashboardSVG,
  IntegrationSVG,
  KeyshadeLogoSVG,
  RolesSVG,
  SettingsSVG,
  TeamSVG
} from '@public/svg/shared'
import SidebarTab from './sidebarTab'
import TierLimit from './tierLimit'
import { Combobox } from '@/components/ui/combobox'
import { selectedWorkspaceAtom } from '@/store'
import { Button } from '@/components/ui/button'
import { VERSION_BADGE } from '@/constants/sidebar'

function Sidebar(): JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const sidebarTabData = [
    {
      name: 'Dashboard',
      icon: <DashboardSVG />,
      link: '/',
      matchTo: '/'
    },
    {
      name: 'Members',
      icon: <TeamSVG />,
      link: '/members?tab=joined',
      matchTo: '/members'
    },
    {
      name: 'Roles',
      icon: <RolesSVG />,
      link: '/roles',
      matchTo: '/roles'
    },
    {
      name: 'Integrations',
      icon: <IntegrationSVG />,
      link: '/integrations?tab=overview',
      matchTo: '/integrations'
    },
    {
      name: 'Billing',
      icon: <CardSVG />,
      link: `/${selectedWorkspace?.slug}/billing`,
      matchTo: `/${selectedWorkspace?.slug}/billing`
    },
    {
      name: 'Settings',
      icon: <SettingsSVG />,
      link: `/${selectedWorkspace?.slug}/settings`,
      matchTo: [`/${selectedWorkspace?.slug}/settings`]
    }
  ]

  const formatPlan = (): string => {
    return `${selectedWorkspace?.subscription.plan[0].toUpperCase()}${selectedWorkspace?.subscription.plan.slice(1).toLowerCase()}`
  }

  return (
    <aside className="m-8 w-[14rem]">
      <div className="grid gap-y-[1.88rem]">
        <div className="mt-5 flex items-center justify-between">
          <div className=" flex gap-2 text-xl">
            <KeyshadeLogoSVG /> Keyshade
          </div>
          <div className="rounded bg-white/10 px-2 py-[0.12rem] text-xs font-bold">
            {VERSION_BADGE}
          </div>
        </div>
        <Combobox />
        <div className="flex w-full flex-col">
          {sidebarTabData.map((tabData) => {
            return (
              <SidebarTab
                icon={tabData.icon}
                key={tabData.name}
                link={tabData.link}
                matchTo={tabData.matchTo}
                name={tabData.name}
              />
            )
          })}
        </div>
        <div className="absolute bottom-12 w-[16rem] rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="mb-5 flex items-center gap-3">
            <Button className="h-6 cursor-default bg-[#60A5FA4D] p-3 text-white hover:bg-[#60A5FA4D]">
              {formatPlan()}
            </Button>
          </div>

          <TierLimit />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
