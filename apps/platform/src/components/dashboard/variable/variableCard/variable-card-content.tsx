import type { Environment, Variable } from '@keyshade/schema'
import React, { useEffect, useState } from 'react'
import { useSetAtom } from 'jotai'
import { TrashWhiteSVG } from '@public/svg/shared'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { AccordionContent } from '@/components/ui/accordion'
import ControllerInstance from '@/lib/controller-instance'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  deleteEnvironmentValueOfVariableOpenAtom,
  selectedSecretEnvironmentAtom,
  selectedVariableAtom
} from '@/store'

interface VariableCardContentProps {
  variableData: Variable
}

export default function VariableCardContent({
  variableData
}: VariableCardContentProps): React.JSX.Element {
  const [disabledEnvironments, setDisabledEnvironments] = useState<Set<string>>(
    new Set()
  )

  const setSelectedVariableEnvironment = useSetAtom(
    selectedSecretEnvironmentAtom
  )
  const setIsDeleteEnvironmentValueOfVariableOpen = useSetAtom(
    deleteEnvironmentValueOfVariableOpenAtom
  )
  const setSelectedVariable = useSetAtom(selectedVariableAtom)

  const versions = variableData.versions

  const handleDeleteEnvironmentValueOfVariableClick = (
    environment: Environment['slug']
  ) => {
    setSelectedVariable(variableData)
    setSelectedVariableEnvironment(environment)
    setIsDeleteEnvironmentValueOfVariableOpen(true)
  }

  const handleToggleDisableVariableClick = async (
    environmentSlug: Environment['slug'],
    environmentId: Environment['id'],
    checked: boolean
  ) => {
    const controller = ControllerInstance.getInstance().variableController
    if (checked) {
      // Enable variable
      await controller.enableVariable({
        variableSlug: variableData.slug,
        environmentSlug
      })
      setDisabledEnvironments((prev) => {
        const next = new Set(prev)
        next.delete(environmentId) // Update local state
        return next
      })
    } else {
      // Disable variable
      await controller.disableVariable({
        variableSlug: variableData.slug,
        environmentSlug
      })
      setDisabledEnvironments((prev) => {
        const next = new Set(prev)
        next.add(environmentId) // Update local state
        return next
      })
    }
  }

  useEffect(() => {
    const fetchDisabled = async () => {
      try {
        const res =
          await ControllerInstance.getInstance().variableController.getAllDisabledEnvironmentsOfVariable(
            { variableSlug: variableData.slug }
          )

        if (res.success && res.data) {
          setDisabledEnvironments(new Set(res.data))
        }
      } catch (error) {
        // eslint-disable-next-line no-console -- console.error is used for debugging
        console.error('Failed to load disabled environments', error)
      }
    }

    fetchDisabled()
  }, [variableData.slug])

  return (
    <AccordionContent>
      {versions.length > 0 ? (
        <Table className="h-full w-full rounded-lg">
          <TableHeader className="h-12.5 w-full">
            <TableRow className="h-12.5 w-full hover:bg-transparent">
              <TableHead className="h-full text-base font-normal text-white/50">
                Environment
              </TableHead>
              <TableHead className="h-full min-w-[200px] font-normal text-white/50">
                Value
              </TableHead>
              <TableHead className="h-full font-normal text-white/50">
                Version
              </TableHead>
              <TableHead className="h-full font-normal text-white/50">
                Enabled
              </TableHead>
              <TableHead className="h-full font-normal text-white/50">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {versions.map((value) => {
              const isDisabled = disabledEnvironments.has(value.environment.id)
              return (
                <TableRow
                  className="h-12.5 group w-full py-4 hover:bg-white/5"
                  key={value.environment.id}
                >
                  <TableCell className="w-41 h-full text-base">
                    {value.environment.name}
                  </TableCell>
                  <TableCell className="h-full min-w-[200px] text-base">
                    {value.value}
                  </TableCell>
                  <TableCell className="h-full text-base">
                    {value.version}
                  </TableCell>
                  <TableCell className="h-full">
                    <Switch
                      checked={!isDisabled}
                      onCheckedChange={(checked) =>
                        handleToggleDisableVariableClick(
                          value.environment.slug,
                          value.environment.id,
                          checked
                        )
                      }
                    />
                  </TableCell>
                  <TableCell className="h-full">
                    <Button
                      onClick={() =>
                        handleDeleteEnvironmentValueOfVariableClick(
                          value.environment.slug
                        )
                      }
                      variant="outline"
                    >
                      <TrashWhiteSVG />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="flex items-center justify-center py-8 text-sm text-white/50">
          You have not added any values for any environment to this variable
          yet. Edit the variable to add values.
        </div>
      )}
    </AccordionContent>
  )
}
