import React from 'react'
import {
  DashboardSVG,
  IntegrationSVG,
  KeyshadeLogoSVG,
  SettingsSVG,
  TeamSVG
} from '@public/svg/shared'
import { Combobox } from '@/components/ui/combobox'
import SidebarTab from './sidebarTab'

function Sidebar(): JSX.Element {
  const sidebarTabData = [
    {
      name: 'Dashboard',
      icon: <DashboardSVG />,
      link: '/',
      matchTo: ''
    },
    {
      name: 'Teams',
      icon: <TeamSVG />,
      link: '/teams',
      matchTo: 'teams'
    },
    {
      name: 'Integrations',
      icon: <IntegrationSVG />,
      link: '/',
      matchTo: 'integrations'
    },
    {
      name: 'Settings',
      icon: <SettingsSVG />,
      link: '/settings?tab=workspace',
      matchTo: 'settings'
    }
  ]

  return (
    <aside className="m-8 w-[20rem]">
      <div className="grid gap-y-[1.88rem]">
        <div className="mt-5 flex items-center justify-between">
          <div className=" flex gap-2 text-xl">
            {' '}
            <KeyshadeLogoSVG /> Keyshade
          </div>
          <div className="rounded bg-white/10 px-2 py-[0.12rem] text-xs font-bold">
            BETA
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
      </div>
    </aside>
  )
}

export default Sidebar
