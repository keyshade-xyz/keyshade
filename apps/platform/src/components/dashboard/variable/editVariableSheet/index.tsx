'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { UpdateVariableRequest } from '@keyshade/schema'
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

export default function EditVariablSheet() {
  const [isEditVariableOpen, setIsEditVariableOpen] =
    useAtom(editVariableOpenAtom)
  const selectedVariableData = useAtomValue(selectedVariableAtom)
  const setVariables = useSetAtom(variablesOfProjectAtom)

  const [requestData, setRequestData] = useState<{
    name: string | undefined
    note: string | undefined
  }>({
    name: selectedVariableData?.variable.name,
    note: selectedVariableData?.variable.note || ''
  })

  const handleClose = useCallback(() => {
    setIsEditVariableOpen(false)
  }, [setIsEditVariableOpen])

  const updateRequestData = useCallback((key: string, value: string) => {
    setRequestData((prev) => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const updateVariable = useCallback(async () => {
    if (!selectedVariableData) {
      toast.error('No variable selected', {
        description: (
          <p className="text-xs text-red-300">
            No variable selected. Please select a variable.
          </p>
        )
      })
      return
    }

    const { variable } = selectedVariableData

    const request: UpdateVariableRequest = {
      variableSlug: variable.slug,
      name:
        requestData.name === variable.name || requestData.name === ''
          ? undefined
          : requestData.name,
      note: requestData.note === '' ? undefined : requestData.note,
      entries: undefined
    }

    const { success, error, data } =
      await ControllerInstance.getInstance().variableController.updateVariable(
        request,
        {}
      )

    if (success && data) {
      toast.success('Variable edited successfully', {
        description: (
          <p className="text-xs text-emerald-300">
            You successfully edited the variable
          </p>
        )
      })

      // Update the variable in the store
      setVariables((prev) => {
        const newVariables = prev.map((v) => {
          if (v.variable.slug === variable.slug) {
            return {
              ...v,
              variable: {
                ...v.variable,
                name: requestData.name || v.variable.name,
                note: requestData.note || v.variable.note,
                slug: data.variable.slug
              }
            }
          }
          return v
        })
        return newVariables
      })

      handleClose()
    } else {
      throw new Error(JSON.stringify(error))
    }
  }, [selectedVariableData, requestData, handleClose, setVariables])

  return (
    <Sheet
      onOpenChange={(open) => {
        setIsEditVariableOpen(open)
      }}
      open={isEditVariableOpen}
    >
      <SheetContent className="border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Edit this variable</SheetTitle>
          <SheetDescription className="text-white/60">
            Edit the variable name or the note
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-x-4 gap-y-6 py-8">
          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              Variable Name
            </Label>
            <Input
              className="col-span-3 h-[2.75rem]"
              id="name"
              onChange={(e) => updateRequestData(e.target.name, e.target.value)}
              placeholder="Enter the name of the variable"
              value={requestData.name}
            />
          </div>

          <div className="flex flex-col items-start gap-x-4 gap-y-3">
            <Label className="text-right" htmlFor="name">
              Extra Note
            </Label>
            <Textarea
              className="col-span-3 h-[2.75rem]"
              id="name"
              onChange={(e) => updateRequestData(e.target.name, e.target.value)}
              placeholder="Enter the note of the variable"
              value={requestData.note}
            />
          </div>
        </div>
        <SheetFooter className="py-3">
          <SheetClose asChild>
            <Button
              className="font-semibold"
              onClick={updateVariable}
              variant="secondary"
            >
              Edit Variable
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
