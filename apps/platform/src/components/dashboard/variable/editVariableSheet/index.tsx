'use client'

import { useCallback, useState, useMemo } from 'react'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import ControllerInstance from '@/lib/controller-instance'
import {
  editVariableOpenAtom,
  selectedVariableAtom,
  variablesOfProjectAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'
import EnvironmentValueEditor from '@/components/common/environment-value-editor'
import {
  mergeExistingEnvironments,
  parseUpdatedEnvironmentValues
} from '@/lib/utils'

export default function EditVariablSheet() {
  const [isEditVariableOpen, setIsEditVariableOpen] =
    useAtom(editVariableOpenAtom)
  const selectedVariableData = useAtomValue(selectedVariableAtom)
  const setVariables = useSetAtom(variablesOfProjectAtom)

  const [name, setName] = useState(selectedVariableData?.variable.name || '')
  const [note, setNote] = useState(selectedVariableData?.variable.note || '')
  const [isLoading, setIsLoading] = useState(false)
  const [environmentValues, setEnvironmentValues] = useState<
    Record<string, string>
  >(
    () =>
      selectedVariableData?.values.reduce(
        (acc, entry) => {
          acc[entry.environment.slug] = entry.value
          return acc
        },
        {} as Record<string, string>
      ) || {}
  )
  const originalValues = useMemo(
    () =>
      selectedVariableData?.values.reduce(
        (acc, entry) => {
          acc[entry.environment.slug] = entry.value
          return acc
        },
        {} as Record<string, string>
      ) || {},
    [selectedVariableData]
  )

  const hasChanges = useMemo(() => {
    if (!selectedVariableData) return false

    const nameChanged = name !== selectedVariableData.variable.name
    const noteChanged = note !== (selectedVariableData.variable.note || '')

    const allEnvironmentSlugs = new Set([
      ...Object.keys(originalValues),
      ...Object.keys(environmentValues)
    ])

    const envChanged = Array.from(allEnvironmentSlugs).some((slug) => {
      const originalValue = originalValues[slug] || ''
      const currentValue = environmentValues[slug] || ''
      return originalValue !== currentValue
    })

    return nameChanged || noteChanged || envChanged
  }, [name, note, environmentValues, originalValues, selectedVariableData])

  const getChangedEnvValues = () => {
    const changed: Record<string, string> = {}
    const allEnvironmentSlugs = new Set([
      ...Object.keys(originalValues),
      ...Object.keys(environmentValues)
    ])

    Array.from(allEnvironmentSlugs).forEach((slug) => {
      const originalValue = originalValues[slug] || ''
      const currentValue = environmentValues[slug] || ''

      if (originalValue !== currentValue) {
        changed[slug] = currentValue
      }
    })

    return changed
  }

  const updateVariable = useHttp(() => {
    const changedEnvValues = getChangedEnvValues()
    const hasEnvChanges = Object.keys(changedEnvValues).length > 0

    return ControllerInstance.getInstance().variableController.updateVariable({
      variableSlug: selectedVariableData!.variable.slug,
      name:
        name !== selectedVariableData!.variable.name ? name.trim() : undefined,
      note:
        note !== (selectedVariableData!.variable.note || '')
          ? note.trim()
          : undefined,
      entries: hasEnvChanges
        ? parseUpdatedEnvironmentValues(
            selectedVariableData!.values.filter((v) =>
              Object.prototype.hasOwnProperty.call(
                changedEnvValues,
                v.environment.slug
              )
            ),
            changedEnvValues
          )
        : undefined
    })
  })

  const handleSave = useCallback(async () => {
    if (!selectedVariableData || !hasChanges) return

    setIsLoading(true)
    toast.loading('Updating variable...')

    try {
      const { success, data } = await updateVariable()
      if (success && data) {
        toast.success('Variable updated successfully')

        setVariables((prev) =>
          prev.map((v) => {
            if (v.variable.slug === selectedVariableData.variable.slug) {
              return {
                ...v,
                variable: {
                  ...v.variable,
                  name,
                  note,
                  slug: data.variable.slug
                },
                values: mergeExistingEnvironments(
                  v.values,
                  data.updatedVersions
                )
              }
            }
            return v
          })
        )

        setIsEditVariableOpen(false)
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }, [
    selectedVariableData,
    hasChanges,
    updateVariable,
    setVariables,
    name,
    note,
    setIsEditVariableOpen
  ])

  return (
    <Sheet onOpenChange={setIsEditVariableOpen} open={isEditVariableOpen}>
      <SheetContent className="border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Edit Variable</SheetTitle>
          <SheetDescription className="text-white/60">
            Edit the variable name, note, or environment values
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-6 py-8">
          <div className="space-y-2">
            <Label htmlFor="name">Variable Name</Label>
            <Input
              id="name"
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter variable name"
              value={name}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              onChange={(e) => setNote(e.target.value)}
              placeholder="Enter note"
              value={note}
            />
          </div>

          <EnvironmentValueEditor
            environmentValues={environmentValues}
            setEnvironmentValues={setEnvironmentValues}
          />
        </div>

        <SheetFooter>
          <SheetClose asChild>
            <Button
              disabled={isLoading || !hasChanges}
              onClick={handleSave}
              variant="secondary"
            >
              Save Changes
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
