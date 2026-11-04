'use client'
import React, { useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import {
  DocumentSVG,
  FeedbackSVG,
  KeyshadeLogoSVG,
  LinkArrowSVG
} from '@public/svg/shared'
import SidebarTab from './sidebarTab'
import { selectedProjectAtom, selectedWorkspaceAtom } from '@/store'
import { VERSION_BADGE } from '@/constants/sidebar'
import { GeistSansFont } from '@/fonts'
import { Combobox } from '@/components/ui/combobox'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

const SIDEBAR_COLLAPSED_KEY = 'keyshade-sidebar-collapsed'
const SIDEBAR_NAVIGATION_ID = 'platform-sidebar-navigation'
const sidebarIconClassName = 'h-[1.625rem] w-[1.625rem] stroke-[2.25]'

function DashboardIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={sidebarIconClassName}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 4.1 17.9 7.5c1.15.66 1.87 1.89 1.87 3.22v4.28c0 2.12-1.72 3.84-3.84 3.84H8.07A3.84 3.84 0 0 1 4.23 15v-4.28c0-1.33.72-2.56 1.87-3.22L12 4.1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.45 13.88c1.45 1.17 3.65 1.17 5.1 0"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MembersIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={sidebarIconClassName}
      fill="none"
      viewBox="0 0 24 24"
    >
      <ellipse cx="12" cy="16" rx="5.35" ry="3.05" stroke="currentColor" />
      <circle cx="12" cy="8.25" r="3.05" stroke="currentColor" />
      <path
        d="M5.95 6.85c-1.72.16-3.02 1.2-3.02 2.45 0 1.23 1.28 2.26 2.96 2.44M18.05 6.85c1.72.16 3.02 1.2 3.02 2.45 0 1.23-1.28 2.26-2.96 2.44M5.4 14.05c-1.9.32-3.2 1.26-3.2 2.36 0 1.18 1.5 2.16 3.62 2.43M18.6 14.05c1.9.32 3.2 1.26 3.2 2.36 0 1.18-1.5 2.16-3.62 2.43"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

function RolesIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={sidebarIconClassName}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12 3.05 18.95 7.05a2.9 2.9 0 0 1 1.45 2.52v4.86a2.9 2.9 0 0 1-1.45 2.52L12 20.95l-6.95-4a2.9 2.9 0 0 1-1.45-2.52V9.57a2.9 2.9 0 0 1 1.45-2.52L12 3.05Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9.45" r="2.05" stroke="currentColor" />
      <path
        d="M7.9 16.2c.55-2.05 2.05-3.28 4.1-3.28s3.55 1.23 4.1 3.28"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

function PasswordManagerIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={sidebarIconClassName}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M8.65 5.45H6.2A2.95 2.95 0 0 0 3.25 8.4v7.2a2.95 2.95 0 0 0 2.95 2.95h2.45"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path
        d="M15.35 5.45h2.45a2.95 2.95 0 0 1 2.95 2.95v7.2a2.95 2.95 0 0 1-2.95 2.95h-2.45"
        stroke="currentColor"
        strokeLinecap="round"
      />
      <path d="M12 4v16" stroke="currentColor" strokeLinecap="round" />
      <path
        d="M7.75 12h.01M9.85 12h.01"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

function IntegrationIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={sidebarIconClassName}
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect
        height="4.25"
        rx="1.3"
        stroke="currentColor"
        width="6.25"
        x="2.8"
        y="4"
      />
      <rect
        height="4.25"
        rx="1.3"
        stroke="currentColor"
        width="6.25"
        x="14.95"
        y="4"
      />
      <rect
        height="4.25"
        rx="1.3"
        stroke="currentColor"
        width="6.25"
        x="14.95"
        y="10"
      />
      <rect
        height="4.25"
        rx="1.3"
        stroke="currentColor"
        width="6.25"
        x="14.95"
        y="16"
      />
      <path
        d="M9.05 6.12h3.35c1.4 0 2.55 1.15 2.55 2.55v9.45M9.05 6.12h5.9M9.05 6.12h5.9v6M14.95 18.12h-2.6a2.55 2.55 0 0 1-2.55-2.55V6.12"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function BillingIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={sidebarIconClassName}
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect
        height="12"
        rx="3.4"
        stroke="currentColor"
        width="17.5"
        x="3.25"
        y="6"
      />
      <path d="M3.75 10h16.5" stroke="currentColor" />
      <path
        d="M7.25 14.65h4.1M13.45 14.65h1.85"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SettingsIcon(): React.JSX.Element {
  return (
    <svg
      aria-hidden="true"
      className={sidebarIconClassName}
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.72l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" />
    </svg>
  )
}

function Sidebar(): React.JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isPreferenceLoaded, setIsPreferenceLoaded] = useState(false)

  useEffect(() => {
    setIsCollapsed(
      window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
    )
    setIsPreferenceLoaded(true)
  }, [])

  useEffect(() => {
    if (isPreferenceLoaded) {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed))
    }
  }, [isCollapsed, isPreferenceLoaded])

  const passwordManagerLink =
    selectedWorkspace?.slug && selectedProject?.slug
      ? `/${selectedWorkspace.slug}/${selectedProject.slug}?tab=secrets`
      : '/'

  const sidebarTabData = [
    {
      name: 'Dashboard',
      icon: <DashboardIcon />,
      link: '/',
      matchTo: '/'
    },
    {
      name: 'Members',
      icon: <MembersIcon />,
      link: '/members?tab=joined',
      matchTo: '/members'
    },
    {
      name: 'Roles',
      icon: <RolesIcon />,
      link: '/roles',
      matchTo: '/roles'
    },
    {
      name: 'Password Manager',
      icon: <PasswordManagerIcon />,
      link: passwordManagerLink,
      matchTo: selectedProject?.slug ? passwordManagerLink : ''
    },
    {
      name: 'Integration',
      icon: <IntegrationIcon />,
      link: '/integrations?tab=overview',
      matchTo: '/integrations'
    },
    {
      name: 'Billing',
      icon: <BillingIcon />,
      link: `/${selectedWorkspace?.slug}/billing`,
      matchTo: `/${selectedWorkspace?.slug}/billing`
    },
    {
      name: 'Settings',
      icon: <SettingsIcon />,
      link: `/${selectedWorkspace?.slug}/settings`,
      matchTo: `/${selectedWorkspace?.slug}/settings`
    }
  ]

  return (
    <aside
      className={cn(
        GeistSansFont.className,
        'm-6 shrink-0 transition-[width,min-width] duration-300 ease-in-out',
        isCollapsed
          ? 'w-[4.75rem] min-w-[4.75rem]'
          : 'w-[18.9375rem] min-w-[18.9375rem]'
      )}
    >
      <TooltipProvider delayDuration={150}>
        <div
          className={cn(
            'flex h-full flex-col gap-4 rounded-none bg-transparent',
            isCollapsed && 'items-center'
          )}
        >
          {/* Sticky Header */}
          <div className="sticky top-0 z-50 w-full">
            <div
              className={cn(
                'flex items-center',
                isCollapsed ? 'justify-center' : 'justify-between'
              )}
            >
              <div
                className={cn(
                  'flex items-center gap-2 text-xl',
                  isCollapsed && 'justify-center'
                )}
              >
                <KeyshadeLogoSVG />
                {!isCollapsed && <span>Keyshade</span>}
              </div>
              <div
                className={cn(
                  'items-center gap-3',
                  isCollapsed ? 'hidden' : 'flex'
                )}
              >
                <div className="rounded-sm bg-white/10 px-2 py-[0.12rem] text-xs font-normal">
                  {VERSION_BADGE}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-controls={SIDEBAR_NAVIGATION_ID}
                      aria-expanded={!isCollapsed}
                      aria-label="Collapse sidebar"
                      className="border-white/8 h-8 w-8 p-0 text-neutral-400 hover:text-white"
                      onClick={() => setIsCollapsed(true)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <PanelLeftClose className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Collapse sidebar</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>

          {!isCollapsed && <Combobox />}

          {isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-eerie-black border-white/8 flex h-10 w-10 items-center justify-center rounded-lg border text-xl">
                  {selectedWorkspace?.icon ?? ''}
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                {selectedWorkspace?.name ?? 'Workspace'}
              </TooltipContent>
            </Tooltip>
          ) : null}

          <div className="h-px w-full bg-white/10" />

          {/* Scrollable Menu Items */}
          <div
            className={cn(
              'scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent min-h-0 flex-1 overflow-y-auto overscroll-contain pt-2',
              isCollapsed ? 'w-full space-y-3' : 'w-full space-y-1'
            )}
            id={SIDEBAR_NAVIGATION_ID}
          >
            {sidebarTabData.map((tabData) => {
              return (
                <SidebarTab
                  icon={tabData.icon}
                  isCollapsed={isCollapsed}
                  key={tabData.name}
                  link={tabData.link}
                  matchTo={tabData.matchTo}
                  name={tabData.name}
                />
              )
            })}
          </div>

          {!isCollapsed && (
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
          )}

          {/* Sticky Footer */}
          <div
            className={cn(
              'sticky bottom-0 z-50 pt-4',
              isCollapsed ? 'flex w-full justify-center' : 'hidden'
            )}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-controls={SIDEBAR_NAVIGATION_ID}
                  aria-expanded={!isCollapsed}
                  aria-label="Expand sidebar"
                  className="border-white/8 h-10 w-10 p-0 text-neutral-400 hover:text-white"
                  onClick={() => setIsCollapsed(false)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </TooltipProvider>
    </aside>
  )
}

export default Sidebar
