import type { Integration } from '@keyshade/schema'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'

interface EventSubscriptionsProps {
  selectedIntegration: Integration
}
function EventSubscriptions({ selectedIntegration }: EventSubscriptionsProps) {
  const [showAllEvents, setShowAllEvents] = useState<boolean>(false)

  const INITIAL_EVENTS_COUNT = 9
  const totalEventsCount = selectedIntegration.notifyOn.length
  const visibleEvents = showAllEvents
    ? selectedIntegration.notifyOn
    : selectedIntegration.notifyOn.slice(0, INITIAL_EVENTS_COUNT)

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-xl font-semibold text-white">Event Subscription</h2>
        <p className="text-sm text-white/60">
          These events will trigger the integration automatically.
        </p>
      </div>

      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          {visibleEvents.map((event) => (
            <span
              className="inline-flex items-center rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/15"
              key={event}
            >
              {event
                .replace(/_/g, ' ')
                .toLowerCase()
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </span>
          ))}
        </div>
        {totalEventsCount > INITIAL_EVENTS_COUNT && (
          <Button
            className="bg-blue-400/w0 border border-white/20 text-sm font-medium text-blue-400 transition-colors hover:bg-transparent hover:text-blue-500"
            onClick={() => setShowAllEvents(!showAllEvents)}
          >
            {showAllEvents
              ? 'Show less'
              : `Show ${totalEventsCount - INITIAL_EVENTS_COUNT} more`}
          </Button>
        )}
      </div>
    </div>
  )
}

export default EventSubscriptions
