import React from 'react'
import ProjectScreenLoader from '@/components/dashboard/project/projectScreenLoader'

/**
 * ProjectLoader component that conditionally renders a loading screen or its children.
 * @param children - The content to display when not loading.
 * @param loading - A boolean indicating if the content is currently loading.
 */
export default function ProjectLoader({
  children,
  loading
}: {
  children: React.ReactNode
  loading: boolean
}): React.JSX.Element {
  if (loading) {
    return <ProjectScreenLoader />
  }
  return <>{children}</>
}
