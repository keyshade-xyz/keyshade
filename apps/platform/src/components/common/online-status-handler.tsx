'use client'

import { useOnlineStatus } from '@/hooks/use-online-status'

function OnlineStatusHandler() {
  useOnlineStatus()
  return null
}

export default OnlineStatusHandler
