import React from 'react'
import EmptyProjectsState from '../emptyProjectState'

export default function ProjectEmpty({
  children,
  isEmpty
}: {
  children: React.ReactNode
  isEmpty: boolean
}): React.JSX.Element {
  if (isEmpty) {
    return <EmptyProjectsState />
  }
  return <>{children}</>
}
