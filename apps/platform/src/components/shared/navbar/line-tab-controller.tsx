import React from 'react'
import { useAtomValue } from 'jotai'
import { usePathname } from 'next/navigation'
import LineTab from '@/components/ui/line-tab'
import { selectedProjectAtom, selectedWorkspaceAtom } from '@/store'
import { TAB_CONFIGS } from '@/constants/navbar/tab-config'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
}

export default function LineTabController() {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const pathname = usePathname()

  const getProjectPath = (): string =>
    selectedWorkspace?.slug && selectedProject?.slug
      ? `/${selectedWorkspace.slug}/${selectedProject.slug}`
      : ''

  const shouldRenderTab = (): boolean => {
    const allowedPaths = ['/settings', '/members', getProjectPath()] // modify the list based on what paths you want to have tab
    return pathname !== '/' && allowedPaths.includes(pathname)
  }

  const renderTabs = (): Tab[] => {
    // You need to update the case if you want to have a tab for a specific path
    switch (pathname) {
      case `/${selectedWorkspace?.slug}/${selectedProject?.slug}`:
        return TAB_CONFIGS.project

      case '/settings':
        return TAB_CONFIGS.settings

      // case '/members':
      //   return TAB_CONFIGS.members

      default:
        return []
    }
  }

  return (
    <div className="px-4">
      {shouldRenderTab() && <LineTab customID="linetab" tabs={renderTabs()} />}
    </div>
  )
}
