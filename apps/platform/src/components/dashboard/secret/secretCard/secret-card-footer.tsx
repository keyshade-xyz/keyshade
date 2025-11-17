import { useAtomValue } from 'jotai'
import type { Environment, Secret } from '@keyshade/schema'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Badge } from '@/components/ui/badge'
import { environmentsOfProjectAtom } from '@/store'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface SecretCardFooterProps {
  secretData: Secret
}

export default function SecretCardFooter({
  secretData
}: SecretCardFooterProps): React.JSX.Element {
  const [environmentList, setEnvironmentList] = useState<
    {
      environment: Environment['name']
      isPopulated: boolean
    }[]
  >([])
  const environmentsOfProject = useAtomValue(environmentsOfProjectAtom)

  useEffect(() => {
    const allEnvironments = new Set<string>(
      environmentsOfProject.map((e) => e.name)
    )

    const populated = new Set<string>()
    for (const version of secretData.versions) {
      populated.add(version.environment.name)
      allEnvironments.delete(version.environment.name)
    }

    const list = [
      ...Array.from(populated).map((name) => ({
        environment: name,
        isPopulated: true
      })),
      ...Array.from(allEnvironments).map((name) => ({
        environment: name,
        isPopulated: false
      }))
    ]

    setEnvironmentList(list)
  }, [secretData, environmentsOfProject])

  return (
    <div className="flex items-end justify-between">
      <div className="flex gap-x-2">
        {environmentList.map((el) => (
          <TooltipProvider key={el.environment}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  className="cursor-pointer"
                  color={el.isPopulated ? '#2DBE99' : '#E26B2D'}
                  icon={el.isPopulated ? 'done' : 'cancel'}
                  type="icon"
                  variant="solid"
                >
                  {el.environment}
                </Badge>
              </TooltipTrigger>
              {!el.isPopulated && (
                <TooltipContent
                  className="bg-night-c border-white/5 text-neutral-200"
                >
                  <p>
                    <span className="font-semibold">{secretData.name}</span>{' '}
                    does not have a value for environment{' '}
                    <span className="font-semibold">{el.environment}</span>
                  </p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
      <div className="flex flex-col items-end gap-y-1 text-sm">
        <div>
          Last updated by{' '}
          <span className="font-semibold">{secretData.lastUpdatedBy.name}</span>
        </div>
        <div className="text-neutral-400">
          {dayjs(secretData.updatedAt).toNow(true)} ago
        </div>
      </div>
    </div>
  )
}
