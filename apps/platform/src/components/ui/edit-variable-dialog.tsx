'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { UpdateVariableRequest } from '@keyshade/schema'
import ControllerInstance from '@/lib/controller-instance'
import { toast } from 'sonner'

function EditVariableDialog({
    isOpen,
    onClose,
    variableSlug
}: {
    isOpen: boolean
    onClose: () => void
    variableSlug: string | null
}) {

  const [variableName, setVariableName] = useState<string>("")
  const [extraNote, setExtraNote] = useState<string>("")

  const updateVariable = async () => {

    if( variableSlug === null ){
        return
    }

    const request: UpdateVariableRequest = {
        variableSlug,
        name: variableName === '' ? undefined : variableName,
        note: extraNote === '' ? undefined : extraNote,
        entries: undefined,
    }

    const { success, error } = await ControllerInstance.getInstance().variableController.updateVariable(
        request,
        {}
    )

    if( success ){
        toast.success('Variable edited successfully', {
            // eslint-disable-next-line react/no-unstable-nested-components -- we need to nest the description
            description: () => (
              <p className="text-xs text-emerald-300">
                You successfully edited the variable
              </p>
            )
        })
    }
    if( error ){
        // eslint-disable-next-line no-console -- we need to log the error
        console.error("Error while updating variable: ", error)
    }

    onClose()

  }

  return (
    <div className="p-4">
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-[#18181B] text-white sm:max-w-[506px] p-6">
          <DialogHeader>
            <DialogTitle className='text-base font-bold text-white'>Edit this variable</DialogTitle>
            <DialogDescription className="text-sm font-normal text-white/60">
              Edit the variable name or the note
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div className="w-full flex justify-between items-center gap-6">
              <Label 
                className="text-base font-semibold text-white w-[7.125rem]"
                htmlFor="variable-name">
                Variable Name
              </Label>
              <Input 
                id="variable-name"
                value={variableName}
                onChange={(e) => setVariableName(e.target.value)}
                className="w-[20rem] bg-[#262626] text-base font-normal text-white"
              />
            </div>
            <div className="w-full flex justify-between items-center gap-6">
              <Label 
                className="text-base font-semibold text-white w-[7.125rem]" 
                htmlFor="extra-note">
                Extra Note
              </Label>
              <Textarea 
                id="extra-note"
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                className="w-[20rem] bg-[#262626] text-base font-normal text-white"
              />
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={updateVariable} 
                variant="secondary" 
                className="bg-[#E0E0E0] border-white/10 hover:bg-gray-200 rounded-lg text-xs font-semibold text-black">
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