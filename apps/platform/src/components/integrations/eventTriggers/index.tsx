'use client'
import React, { useMemo, useState } from 'react'
import type { EventTypeEnum, IntegrationTypeEnum } from '@keyshade/schema'
import { Integrations } from '@keyshade/common'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

const formatEventType = (eventType: string) => {
  return eventType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

interface EventTriggersInputProps {
  selectedEvents: Set<EventTypeEnum>
  onChange: (checkedEvents: Set<EventTypeEnum>) => void
  integrationType: IntegrationTypeEnum
}

const INITIAL_EVENT_COUNT = 8

export default function EventTriggersInput({
  selectedEvents,
  onChange,
  integrationType
}: EventTriggersInputProps) {
  const [showAllEvents, setShowAllEvents] = useState(false)
  const allEvents: EventTypeEnum[] = useMemo(
    () => Integrations[integrationType].events,
    [integrationType]
  )

  const toggleEvent = (event: EventTypeEnum) => {
    if (selectedEvents.has(event)) {
      const updatedEvents = new Set(selectedEvents)
      updatedEvents.delete(event)
      onChange(updatedEvents)
    } else {
      onChange(new Set(selectedEvents).add(event))
    }
  }

  const selectAll = (select: boolean) => {
    onChange(new Set(select ? allEvents : []))
  }

  const visibleEvents = showAllEvents
    ? allEvents
    : allEvents.slice(0, INITIAL_EVENT_COUNT)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="font-medium text-white" htmlFor="select-events">
          Select Event Triggers
        </label>
        <span className="text-xs text-white/40">
          {selectedEvents.size} selected
        </span>
      </div>

      <div
        className="space-y-3 rounded-lg border border-white/10 p-4"
        id="select-events"
      >
        <div className="mb-3 flex items-center space-x-3 border-b border-white/10 pb-3">
          <Checkbox
            checked={selectedEvents.size === allEvents.length}
            className="rounded-[4px] border border-white/10 bg-neutral-700 text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
            id="select-all"
            onCheckedChange={(checked) => selectAll(checked === true)}
          />
          <label
            className="cursor-pointer text-sm font-semibold text-slate-100"
            htmlFor="select-all"
          >
            Select All Events
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {visibleEvents.map((event) => (
            <div className="flex items-center space-x-3" key={event}>
              <Checkbox
                checked={selectedEvents.has(event)}
                className="rounded-[4px] border border-white/10 bg-neutral-700 text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
                id={event}
                onCheckedChange={() => toggleEvent(event)}
              />
              <label
                className="cursor-pointer text-sm font-medium leading-none text-slate-200"
                htmlFor={event}
              >
                {formatEventType(event)}
              </label>
            </div>
          ))}
        </div>

        {allEvents.length > INITIAL_EVENT_COUNT && (
          <div className="flex w-full justify-end">
            <Button
              className="text-white/50 hover:bg-transparent hover:text-white/60"
              onClick={() => setShowAllEvents(!showAllEvents)}
              type="button"
              variant="ghost"
            >
              {showAllEvents ? 'Show Less' : 'Show More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
