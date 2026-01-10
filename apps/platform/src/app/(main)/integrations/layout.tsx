import React from 'react'

interface IntegrationsLayoutProps {
  children: React.ReactNode
}

export default function IntegrationsLayout({
  children
}: IntegrationsLayoutProps) {
  return <div>{children}</div>
}
