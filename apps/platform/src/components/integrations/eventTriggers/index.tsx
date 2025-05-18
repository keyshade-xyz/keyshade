'use client'
import React, { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

/* eslint-disable @typescript-eslint/naming-convention -- allow UPPER_SNAKE_CASE for enum members */
export enum EventType {
  INVITED_TO_WORKSPACE = 'INVITED_TO_WORKSPACE',
  REMOVED_FROM_WORKSPACE = 'REMOVED_FROM_WORKSPACE',
  ACCEPTED_INVITATION = 'ACCEPTED_INVITATION',
  DECLINED_INVITATION = 'DECLINED_INVITATION',
  CANCELLED_INVITATION = 'CANCELLED_INVITATION',
  LEFT_WORKSPACE = 'LEFT_WORKSPACE',
  WORKSPACE_UPDATED = 'WORKSPACE_UPDATED',
  WORKSPACE_CREATED = 'WORKSPACE_CREATED',
  WORKSPACE_ROLE_CREATED = 'WORKSPACE_ROLE_CREATED',
  WORKSPACE_ROLE_UPDATED = 'WORKSPACE_ROLE_UPDATED',
  WORKSPACE_ROLE_DELETED = 'WORKSPACE_ROLE_DELETED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  PROJECT_UPDATED = 'PROJECT_UPDATED',
  PROJECT_DELETED = 'PROJECT_DELETED',
  SECRET_UPDATED = 'SECRET_UPDATED',
  SECRET_DELETED = 'SECRET_DELETED',
  SECRET_ADDED = 'SECRET_ADDED',
  VARIABLE_UPDATED = 'VARIABLE_UPDATED',
  VARIABLE_DELETED = 'VARIABLE_DELETED',
  VARIABLE_ADDED = 'VARIABLE_ADDED',
  ENVIRONMENT_UPDATED = 'ENVIRONMENT_UPDATED',
  ENVIRONMENT_DELETED = 'ENVIRONMENT_DELETED',
  ENVIRONMENT_ADDED = 'ENVIRONMENT_ADDED',
  INTEGRATION_ADDED = 'INTEGRATION_ADDED',
  INTEGRATION_UPDATED = 'INTEGRATION_UPDATED',
  INTEGRATION_DELETED = 'INTEGRATION_DELETED'
}
/* eslint-enable @typescript-eslint/naming-convention -- end exception for enum members */

const formatEventType = (eventType: string) => {
  return eventType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const getAllEvents = (): EventType[] => {
  return Object.values(EventType)
}

interface EventTriggersInputProps {
  selectedEvents: EventType[]
  onChange: (events: EventType[]) => void
}

export default function EventTriggersInput({
  selectedEvents,
  onChange
}: EventTriggersInputProps) {
  const [showAllEvents, setShowAllEvents] = useState(false)

  const allEvents = getAllEvents()
  const initialEventCount = 8

  const toggleEvent = (event: EventType) => {
    onChange(
      selectedEvents.includes(event)
        ? selectedEvents.filter((e) => e !== event)
        : [...selectedEvents, event]
    )
  }

  const selectAll = (select: boolean) => {
    onChange(select ? getAllEvents() : [])
  }

  const visibleEvents = showAllEvents
    ? allEvents
    : allEvents.slice(0, initialEventCount)
  const areAllSelected = allEvents.every((event) =>
    selectedEvents.includes(event)
  )

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="font-medium text-white" htmlFor="select-events">
          Select Event Triggers
        </label>
        <span className="text-xs text-white/40">
          {selectedEvents.length} selected
        </span>
      </div>

      <div
        className="space-y-3 rounded-lg border border-white/10 bg-neutral-800 p-4"
        id="select-events"
      >
        <div className="mb-3 flex items-center space-x-3 border-b border-white/10 pb-3">
          <Checkbox
            checked={areAllSelected}
            className="rounded-[4px] border border-[#18181B] bg-[#71717A] text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
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
                checked={selectedEvents.includes(event)}
                className="rounded-[4px] border border-[#18181B] bg-[#71717A] text-black data-[state=checked]:border-[#18181B] data-[state=checked]:bg-white/90 data-[state=checked]:text-black"
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

        {allEvents.length > initialEventCount && (
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
