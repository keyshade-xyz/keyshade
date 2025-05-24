'use client'
import { DiscordSVG, IntegrationSVG, SlackSVG } from '@public/svg/shared'
import type { IntegrationType } from '@keyshade/common'
import React from 'react'
import { cn } from '@/lib/utils'

const intgrationIcon = {
  DISCORD: DiscordSVG,
  SLACK: SlackSVG
  // Add new integrations here
}

interface IntegrationIconProps {
  type: string
  className?: string
}

function IntegrationIcon({ type, className }: IntegrationIconProps) {
  const normalizedType = type.toUpperCase() as IntegrationType

  const IconComponent = intgrationIcon[normalizedType] || IntegrationSVG
  return <IconComponent className={cn(className)} />
}

export default IntegrationIcon
