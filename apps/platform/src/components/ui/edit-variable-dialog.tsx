'use client'

import { useState } from 'react'
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

function EditVariableDialog({
  isOpen,
  onClose,
  variableSlug,
  variableName,
  variableNote
}: {
  isOpen: boolean
  onClose: () => void
  variableSlug: string | null
  variableName: string
  variableNote: string
}) {
  const [newVariableName, setNewVariableName] = useState<string>(variableName)
  const [extraNote, setExtraNote] = useState<string>(variableNote)

  const updateVariable = async () => {
    if (variableSlug === null) {
      return
    }

    const request: UpdateVariableRequest = {
      variableSlug,
      name: newVariableName === variableName ? undefined : newVariableName,
      note: extraNote === '' ? undefined : extraNote,
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
      // eslint-disable-next-line no-console -- we need to log the error
      console.error('Error while updating variable: ', error)
    }

    onClose()
  }

  return (
    <div className="p-4">
      <Dialog onOpenChange={onClose} open={isOpen}>
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
                onChange={(e) => setNewVariableName(e.target.value)}
                value={newVariableName}
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
                onChange={(e) => setExtraNote(e.target.value)}
                value={extraNote}
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

export default EditVariableDialog
