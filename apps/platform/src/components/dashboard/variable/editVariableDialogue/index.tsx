'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import type { UpdateVariableRequest } from '@keyshade/schema'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import ControllerInstance from '@/lib/controller-instance'
import { useAtom, useAtomValue } from 'jotai'
import { editVariableOpenAtom, selectedVariableAtom } from '@/store'

export default function EditVariableDialog() {
  const [isEditVariableOpen, setIsEditVariableOpen] =
    useAtom(editVariableOpenAtom)
  const selectedVariable = useAtomValue(selectedVariableAtom)

  const [requestData, setRequestData] = useState<{
    name: string | undefined
    note: string | undefined
  }>({
    name: selectedVariable?.name,
    note: selectedVariable?.note || ''
  })

  const updateRequestData = useCallback((key: string, value: string) => {
    setRequestData((prev) => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const updateVariable = async () => {
    if (!selectedVariable) {
      toast.error('No variable selected', {
        description: (
          <p className="text-xs text-red-300">
            No variable selected. Please select a variable.
          </p>
        )
      })
      return
    }

    const request: UpdateVariableRequest = {
      variableSlug: selectedVariable.slug,
      name:
        requestData.name === selectedVariable.name
          ? undefined
          : requestData.name,
      note: requestData.note === '' ? undefined : requestData.note,
      entries: undefined
    }

    const { success, error } =
      await ControllerInstance.getInstance().variableController.updateVariable(
        request,
        {}
      )

    if (success) {
      toast.success('Variable edited successfully', {
        description: (
          <p className="text-xs text-emerald-300">
            You successfully edited the variable
          </p>
        )
      })
    }
    if (error) {
      toast.error('Something went wrong!', {
        description: (
          <p className="text-xs text-red-300">
            Something went wrong while updating the variable. Check console for
            more info.
          </p>
        )
      })
      // eslint-disable-next-line no-console -- we need to log the error
      console.error('Error while updating variable: ', error)
    }

    onClose()
  }

  return (
    <div className="p-4">
      <Dialog onOpenChange={onClose} open={isEditVariableOpen}>
        <DialogContent className="bg-[#18181B] p-6 text-white sm:max-w-[506px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">
              Edit this variable
            </DialogTitle>
            <DialogDescription className="text-sm font-normal text-white/60">
              Edit the variable name or the note
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="flex w-full items-center justify-between gap-6">
              <Label
                className="w-[7.125rem] text-base font-semibold text-white"
                htmlFor="variable-name"
              >
                Variable Name
              </Label>
              <Input
                className="w-[20rem] bg-[#262626] text-base font-normal text-white"
                id="variable-name"
                name="name"
                onChange={(e) =>
                  updateRequestData(e.target.name, e.target.value)
                }
                value={requestData.name}
              />
            </div>
            <div className="flex w-full items-center justify-between gap-6">
              <Label
                className="w-[7.125rem] text-base font-semibold text-white"
                htmlFor="extra-note"
              >
                Extra Note
              </Label>
              <Textarea
                className="w-[20rem] bg-[#262626] text-base font-normal text-white"
                id="extra-note"
                name="note"
                onChange={(e) =>
                  updateRequestData(e.target.name, e.target.value)
                }
                value={requestData.note}
              />
            </div>
            <div className="flex justify-end">
              <Button
                className="rounded-lg border-white/10 bg-[#E0E0E0] text-xs font-semibold text-black hover:bg-gray-200"
                onClick={updateVariable}
                variant="secondary"
              >
                Save Variable
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
