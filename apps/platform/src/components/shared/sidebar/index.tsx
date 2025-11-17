'use client'
import React from 'react'
import { useAtomValue } from 'jotai'
import {
  CardSVG,
  DashboardSVG,
  DocumentSVG,
  FeedbackSVG,
  IntegrationSVG,
  KeyshadeLogoSVG,
  LinkArrowSVG,
  RolesSVG,
  SettingsSVG,
  TeamSVG
} from '@public/svg/shared'
import SidebarTab from './sidebarTab'
import { selectedWorkspaceAtom } from '@/store'
import { VERSION_BADGE } from '@/constants/sidebar'
import { GeistSansFont } from '@/fonts'
import { Combobox } from '@/components/ui/combobox'

function Sidebar(): React.JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const sidebarTabData = [
    {
      name: 'Projects',
      icon: <DashboardSVG />,
      link: '/',
      matchTo: '/'
    },
    {
      name: 'Integrations',
      icon: <IntegrationSVG />,
      link: '/integrations?tab=overview',
      matchTo: '/integrations'
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
    <aside
      className={`${GeistSansFont.className}  m-6 w-40 min-w-[16rem] shrink-0 `}
    >
      <div className=" flex h-full flex-col gap-2">
        {/* Sticky Header */}
        <div className="sticky top-0 z-50 pb-4">
          <div className=" flex items-center justify-between">
            <div className=" flex gap-2 text-xl">
              <KeyshadeLogoSVG /> Keyshade
            </div>
            <div className="rounded-sm bg-white/10 px-2 py-[0.12rem] text-xs font-normal">
              {VERSION_BADGE}
            </div>
          </div>
        </div>

        {/* Scrollable Menu Items */}
        <div className="scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto overscroll-contain pt-2">
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

        <div className="flex flex-col gap-y-8 text-neutral-500 [&_a]:flex [&_a]:gap-x-2.5 [&_a]:transition-colors [&_a]:hover:text-white">
          <a
            className="pl-5"
            href="https://docs.keyshade.io/"
            rel="noopener noreferrer"
            target="_blank"
          >
            <DocumentSVG /> Docs{' '}
            <LinkArrowSVG className="-translate-x-1 translate-y-1.5" />
          </a>

          <a
            className="pl-5"
            href="mailto:support@keyshade.io?subject=Feedback%20for%20Keyshade%20Platform"
            rel="noopener noreferrer"
            target="_blank"
          >
            <FeedbackSVG /> Feedback
          </a>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-50 pt-4">
          <Combobox />
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
