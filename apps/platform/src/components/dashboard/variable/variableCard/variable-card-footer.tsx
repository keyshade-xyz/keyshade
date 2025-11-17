import { useAtomValue } from 'jotai'
import type { Environment, Variable } from '@keyshade/schema'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Badge } from '@/components/ui/badge'
import { environmentsOfProjectAtom } from '@/store'

interface VariableCardFooterProps {
  variableData: Variable
}

export default function VariableCardFooter({
  variableData
}: VariableCardFooterProps): React.JSX.Element {
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
    for (const version of variableData.versions) {
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
  }, [variableData, environmentsOfProject])

  return (
    <div className="flex items-end justify-between">
      <div className="flex gap-x-2">
        {environmentList.map((el) => (
          <Badge
            color={el.isPopulated ? '#2DBE99' : '#DC2626'}
            icon={el.isPopulated ? 'done' : 'cancel'}
            key={el.environment}
            type="icon"
            variant="solid"
          >
            {el.environment}
          </Badge>
        ))}
      </div>
      <div className="flex flex-col items-end gap-y-1 text-sm">
        <div>
          Last updated by{' '}
          <span className="font-semibold">
            {variableData.lastUpdatedBy.name}
          </span>
        </div>
        <div className="text-neutral-400">
          {dayjs(variableData.updatedAt).toNow(true)} ago
        </div>
      </div>
    </div>
  )
}
