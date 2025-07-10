'use client'
import React, { useMemo, useState } from 'react'
import type { EventTypeEnum, IntegrationTypeEnum } from '@keyshade/schema'
import { Integrations } from '@keyshade/common'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface EventTriggersInputProps {
  selectedEvents: Set<EventTypeEnum>
  onChange: (checkedEvents: Set<EventTypeEnum>) => void
  integrationType: IntegrationTypeEnum
}
const INITIAL_GROUP_COUNT = 4

export default function EventTriggersInput({
  selectedEvents,
  onChange,
  integrationType
}: EventTriggersInputProps) {
  const [showAllGroups, setShowAllGroups] = useState(false)

  const eventGroups = useMemo(
    () => Integrations[integrationType].events!,
    [integrationType]
  )

  const allEvents: EventTypeEnum[] = useMemo(
    () => eventGroups.flatMap((group) => group.items),
    [eventGroups]
  )

  if (Integrations[integrationType].envMapping === true) {
    if (selectedEvents.size !== allEvents.length) {
      onChange(new Set(allEvents))
    }
    return null
  }

  const toggleGroup = (groupItems: EventTypeEnum[]) => {
    const allGroupSelected = groupItems.every((event) =>
      selectedEvents.has(event)
    )
    const updatedEvents = new Set(selectedEvents)

    if (allGroupSelected) {
      groupItems.forEach((event) => updatedEvents.delete(event))
    } else {
      groupItems.forEach((event) => updatedEvents.add(event))
    }

    onChange(updatedEvents)
  }

  const selectAll = (select: boolean) => {
    onChange(new Set(select ? allEvents : []))
  }

  const isGroupSelected = (groupItems: EventTypeEnum[]) => {
    return groupItems.every((event) => selectedEvents.has(event))
  }

  const visibleGroups = showAllGroups
    ? eventGroups
    : eventGroups.slice(0, INITIAL_GROUP_COUNT)

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
        className="space-y-4 rounded-lg border border-white/10 p-4"
        id="select-events"
      >
        <div className="flex items-center space-x-3 border-b border-white/10 pb-3">
          <Checkbox
            checked={selectedEvents.size === allEvents.length}
            className="rounded-[4px] border border-white/10 bg-neutral-700 text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
            id="select-all"
            onCheckedChange={(checked) => selectAll(checked === true)}
          />
          <label
            className="cursor-pointer text-sm font-semibold text-white/90"
            htmlFor="select-all"
          >
            Select All Events
          </label>
        </div>

        <div className="space-y-5">
          {visibleGroups.map((group) => (
            <div className="" key={group.name}>
              <div className="flex flex-col items-start gap-2">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isGroupSelected(group.items)}
                    className="mt-1 rounded-[4px] border border-white/10 bg-neutral-700 text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
                    id={`group-${group.name}`}
                    onCheckedChange={() => toggleGroup(group.items)}
                  />
                  <label
                    className="cursor-pointer text-sm font-semibold text-white/90"
                    htmlFor={`group-${group.name}`}
                  >
                    <div className="flex flex-col gap-1">
                      {group.name}
                      <p className="text-xs text-white/50">
                        {group.description}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        {eventGroups.length > INITIAL_GROUP_COUNT && (
          <div className="flex w-full justify-end">
            <Button
              className="text-white/50 hover:bg-transparent hover:text-white/60"
              onClick={() => setShowAllGroups(!showAllGroups)}
              type="button"
              variant="ghost"
            >
              {showAllGroups ? 'Show Less' : 'Show More'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
