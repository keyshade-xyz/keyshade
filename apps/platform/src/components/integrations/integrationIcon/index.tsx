'use client'
import React from 'react'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import {
  DiscordSVG,
  IntegrationSVG,
  LambdaSVG,
  SlackSVG,
  VercelSVG
} from '@public/svg/shared'
import { cn } from '@/lib/utils'

const intgrationIcon = {
  DISCORD: DiscordSVG,
  SLACK: SlackSVG,
  VERCEL: VercelSVG,
  AWS_LAMBDA: LambdaSVG
  // Add new integrations here
}

interface IntegrationIconProps {
  type: IntegrationTypeEnum
  className?: string
}

function IntegrationIcon({ type, className }: IntegrationIconProps) {
  const normalizedType = type.toUpperCase()

  const IconComponent = intgrationIcon[normalizedType] || IntegrationSVG
  return <IconComponent className={cn(className)} />
}

export default IntegrationIcon
