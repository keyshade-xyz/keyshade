import type { Integration, IntegrationRun } from '@keyshade/schema'
import { ErrorSVG, PendingSVG, VectorSVG } from '@public/svg/shared'
import React, { useEffect, useState } from 'react'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { formatDate, formatTime } from '@/lib/utils'
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface IntegrationTriggerListProps {
  integration: Integration
}

function IntegrationTriggerList({ integration }: IntegrationTriggerListProps) {
  const [runHistories, setRunHistories] = useState<IntegrationRun[]>([])
  const getIntegrationRuns = useHttp(() =>
    ControllerInstance.getInstance().integrationController.getAllIntegrationRuns(
      {
        integrationSlug: integration.slug
      },
      {}
    )
  )

  useEffect(() => {
    if (integration.workspaceId) {
      getIntegrationRuns().then(({ data, success }) => {
        if (success && data) {
          setRunHistories(data.items)
        }
      })
    }
  }, [getIntegrationRuns, integration])

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
              <p className="whitespace-pre-wrap text-white/80">{eventLog}</p>
            </div>
          ) : (
            <p className="mt-1 text-sm">No log available</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-3/5 flex-1">
      <div className="h-full rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <h2 className="mb-6 text-xl font-semibold text-white">Run History</h2>
        <div className="max-h-[60vh] overflow-y-auto">
          {runHistories.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              <TooltipProvider>
                {runHistories.map((trigger) => (
                  <Tooltip key={trigger.id}>
                    <TooltipTrigger asChild>
                      <div className="flex cursor-pointer justify-between gap-2 rounded-md border border-white/20 bg-white/10 p-3 text-xs font-medium text-white/90 transition-colors hover:bg-white/15">
                        <div className="flex items-start gap-3">
                          <div className="pt-2">
                            {trigger.status === 'SUCCESS' ? (
                              <VectorSVG />
                            ) : trigger.status === 'PENDING' ? (
                              <PendingSVG />
                            ) : (
                              <ErrorSVG />
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-white">
                              {trigger.title}
                            </h3>
                            {trigger.event.title ? (
                              <h4 className="mt-1 text-base font-medium text-white/70">
                                {trigger.event.title}
                              </h4>
                            ) : null}
                            <p className="mt-1 text-sm text-white/50">
                              Duration:{' '}
                              <span className="font-semibold text-white/70">
                                {trigger.duration} ms
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end text-sm text-white/50">
                          <p>{formatTime(trigger.triggeredAt)}</p>
                          <p>{formatDate(trigger.triggeredAt)}</p>
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
                ))}
              </TooltipProvider>
            </div>
          ) : (
            <p className="text-white/70">No triggers found.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default IntegrationTriggerList
