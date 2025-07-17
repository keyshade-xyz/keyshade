import type { Integration, IntegrationRun } from '@keyshade/schema'
import React, { useCallback, useState, useRef } from 'react'
import { Clock, RefreshCcw } from 'lucide-react'
import {
  ErrorTriggerSVG,
  RefreshTriggerSVG,
  SuccessTriggerSVG
} from '@public/svg/shared'
import ControllerInstance from '@/lib/controller-instance'
import { formatDate, formatTime } from '@/lib/utils'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import { Button } from '@/components/ui/button'

interface IntegrationTriggerListProps {
  integration: Integration
}

function IntegrationTriggerList({ integration }: IntegrationTriggerListProps) {
  const [totalTriggerCount, setTotalTriggerCount] = useState<number>(0)
  const [refreshKey, setRefreshKey] = useState<number>(0)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const fetchIntegrationRuns = useCallback(
    async ({ page, limit }: { page: number; limit: number }) => {
      try {
        const response =
          await ControllerInstance.getInstance().integrationController.getAllIntegrationRuns(
            { integrationSlug: integration.slug, page, limit },
            {}
          )
        setTotalTriggerCount(response.data?.metadata.totalCount || 0)
        return {
          success: response.success,
          data: {
            items: response.data?.items || [],
            metadata: { totalCount: response.data?.metadata.totalCount || 0 }
          },
          error: response.error
            ? { message: response.error.message }
            : undefined
        }
      } catch (error) {
        return {
          success: false,
          data: { items: [] },
          error: {
            message: error instanceof Error ? error.message : 'Unknown error'
          }
        }
      }
    },
    [integration]
  )

  const handleRefresh = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
    setRefreshKey((prev) => prev + 1)
  }, [])

  const renderTooltipContent = (trigger: IntegrationRun) => {
    const eventLog = trigger.logs
    const hasLog = eventLog && eventLog.trim().length > 0

    return (
      <div className="space-y-2 p-2">
        <div>
          <h4 className="font-semibold">Event Details</h4>
          <div className="mt-1 space-y-1 text-sm">
            <p>
              <span className="font-medium">Type:</span> {trigger.event.type}
            </p>
            <p>
              <span className="font-medium">Source:</span>{' '}
              {trigger.event.source}
            </p>
            <p>
              <span className="font-medium">Severity:</span>{' '}
              {trigger.event.severity}
            </p>
          </div>
        </div>

        <div>
          <h4 className="font-semibold">Logs</h4>
          {hasLog ? (
            <div className="mt-1 max-h-32 overflow-y-auto text-sm">
              <p className="whitespace-pre-wrap text-black/80">{eventLog}</p>
            </div>
          ) : (
            <p className="mt-1 text-sm">No log available</p>
          )}
        </div>
      </div>
    )
  }

  const renderTriggerItem = (trigger: IntegrationRun) => (
    <Tooltip key={trigger.id}>
      <TooltipTrigger asChild>
        <div className="flex cursor-pointer justify-between gap-2 rounded-md border border-white/20 bg-white/10 p-3 text-xs font-medium text-white/90 transition-colors hover:bg-white/15">
          <div className="flex items-start gap-3">
            <div className="flex h-full items-center pt-2">
              {trigger.status === 'SUCCESS' ? (
                <SuccessTriggerSVG />
              ) : trigger.status === `RUNNING` ? (
                <RefreshTriggerSVG />
              ) : (
                <ErrorTriggerSVG />
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-white">
                {trigger.title}
              </h3>
              {trigger.event.title ? (
                <h4 className="mt-1 text-sm font-semibold text-white/60">
                  {trigger.event.title}
                </h4>
              ) : null}
              <p className="mt-1 text-xs text-white/60">
                {formatTime(trigger.triggeredAt)},{' '}
                {formatDate(trigger.triggeredAt)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-1 text-sm">
            <Clock className="h-4 w-4" />
            <p className="text-sm text-white/50">
              Duration:{' '}
              <span className="font-semibold text-white/70">
                {trigger.duration} ms
              </span>
            </p>
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        className="max-w-xs rounded-md border-white/80 bg-white/70 text-black"
        side="left"
        sideOffset={10}
      >
        <TooltipArrow className="fill-white/70" />
        {renderTooltipContent(trigger)}
      </TooltipContent>
    </Tooltip>
  )

  return (
    <div className="w-3/5 flex-1">
      <div className="h-full rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between border-b border-white/10 pb-3">
          <h2 className="text-xl font-semibold text-white">Run History</h2>
          <div className="flex items-center justify-center">
            <Button
              className="bg-white/10 p-3 font-medium text-white hover:bg-white/20"
              onClick={handleRefresh}
              variant="default"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center gap-1 rounded-md p-2 text-sm font-medium text-white/70">
              <RefreshCcw className="h-4 w-4" />
              {totalTriggerCount} x
            </div>
          </div>
        </div>
        <div
          className="max-h-[75vh] min-h-0 overflow-y-scroll"
          ref={scrollContainerRef}
        >
          <TooltipProvider>
            <InfiniteScrollList<IntegrationRun>
              className="grid grid-cols-1 gap-4"
              fetchFunction={fetchIntegrationRuns}
              itemComponent={renderTriggerItem}
              itemKey={(trigger) => trigger.id}
              itemsPerPage={10}
              key={refreshKey}
            />
          </TooltipProvider>
        </div>
      </div>
    </div>
  )
}

export default IntegrationTriggerList
