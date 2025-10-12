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
      matchTo: `/${selectedWorkspace?.slug}/settings`
    }
  ]

  return (
    <aside className="ml-4 h-screen w-[18rem] min-w-[16rem] flex-shrink-0">
      <div className="flex h-full flex-col gap-2">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 bg-[#0A0A0A] pb-4">
          <div className="mt-5 flex items-center justify-between">
            <div className=" flex gap-2 text-xl">
              <KeyshadeLogoSVG /> Keyshade
            </div>
            <div className="rounded bg-white/10 px-2 py-[0.12rem] text-xs font-bold">
              {VERSION_BADGE}
            </div>
          </div>
          <div className="mt-4">
            <Combobox />
          </div>
        </div>

        {/* Scrollable Menu Items */}
        <div
          className="scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto overscroll-contain"
        >
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

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-50 bg-[#0A0A0A] pt-4 mb-5">
          <TierLimit />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
