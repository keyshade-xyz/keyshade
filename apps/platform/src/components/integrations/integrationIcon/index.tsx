'use client'
import React from 'react'
import type { IntegrationTypeEnum } from '@keyshade/schema'
import {
  AmplifySVG,
  DigitalOceanSVG,
  DiscordSVG,
  FlyioSVG,
  GitHubSVG,
  HerokuSVG,
  IntegrationSVG,
  LambdaSVG,
  NetlifySVG,
  RailwaySVG,
  SlackSVG,
  VercelSVG
} from '@public/svg/shared'
import { cn } from '@/lib/utils'

const intgrationIcon = {
  DISCORD: DiscordSVG,
  SLACK: SlackSVG,
  VERCEL: VercelSVG,
  AWS_LAMBDA: LambdaSVG,
  AWS_AMPLIFY: AmplifySVG,
  NETLIFY: NetlifySVG,
  DIGITAL_OCEAN: DigitalOceanSVG,
  HEROKU: HerokuSVG,
  RAILWAY: RailwaySVG,
  FLYIO: FlyioSVG,
  GITHUB: GitHubSVG
  // Add new integrations here
}

interface IntegrationIconProps {
  type: IntegrationTypeEnum
  className?: string
}

function IntegrationIcon({ type, className }: IntegrationIconProps) {
  const normalizedType = type.toUpperCase()

  const IconComponent = intgrationIcon[normalizedType] || IntegrationSVG
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-lg bg-white p-1.5',
        className
      )}
    >
      <IconComponent />
    </div>
  )
}

export default IntegrationIcon
