import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AddSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import ControllerInstance from '@/lib/controller-instance'
import {
  createVariableOpenAtom,
  selectedProjectAtom,
  environmentsOfProjectAtom,
  variablesOfProjectAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'

interface VariableFormState {
  variableName: string
  note: string
  environmentEntries: Record<string, string>
}

export default function AddVariableDialogue() {
  const [isCreateVariableOpen, setIsCreateVariableOpen] = useAtom(createVariableOpenAtom)
  const environments = useAtomValue(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const setVariables = useSetAtom(variablesOfProjectAtom)

  const [newVariableData, setNewVariableData] = useState<VariableFormState>({
    variableName: '',
    note: '',
    environmentEntries: {}
  })

  const [isLoading, setIsLoading] = useState<boolean>(false)

  // Sync environment entries when environments change
  useEffect(() => {
    setNewVariableData(prev => {
      const baseEntries = environments.reduce((acc, env) => {
        acc[env.slug] = prev.environmentEntries[env.slug] || ''
        return acc
      }, {} as Record<string, string>)

      return {
        ...prev,
        environmentEntries: {
          ...prev.environmentEntries,
          ...baseEntries
        }
      }
    })
  }, [environments])

  const createVariable = useHttp(() => {
    const payload = {
      name: newVariableData.variableName.trim(),
      projectSlug: selectedProject?.slug,
      note: newVariableData.note.trim(),
      entries: Object.entries(newVariableData.environmentEntries)
        .filter(([_, value]) => value.trim() !== '')
        .map(([slug, value]) => ({
          environmentSlug: slug,
          value: value.trim()
        }))
    }

    return ControllerInstance.getInstance().variableController.createVariable({
      ...payload,
      entries: payload.entries.length > 0 ? payload.entries : undefined
    })
  })

  const handleAddVariable = useCallback(async () => {
    if (!selectedProject) return

    if (!newVariableData.variableName.trim()) {
      toast.error('Variable name is required')
      return
    }

    setIsLoading(true)
    toast.loading('Creating variable...')

    try {
      const { success, data } = await createVariable()

      if (success && data) {
        toast.success('Variable added successfully', {
          description: (
            <p className="text-xs text-emerald-300">
              The variable has been added to the project
            </p>
          )
        })

        setVariables(prev => [...prev, data])
        setIsCreateVariableOpen(false)
        setNewVariableData({
          variableName: '',
          note: '',
          environmentEntries: environments.reduce((acc, env) => ({
            ...acc,
            [env.slug]: ''
          }), {})
        })
      }
    } finally {
      setIsLoading(false)
      toast.dismiss()
    }
  }, [
    selectedProject,
    newVariableData,
    createVariable,
    setVariables,
    setIsCreateVariableOpen,
    environments
  ])

  return (
    <Dialog
      onOpenChange={setIsCreateVariableOpen}
      open={isCreateVariableOpen}
    >
      <DialogTrigger asChild>
        <Button
          className="bg-[#26282C] hover:bg-[#161819] hover:text-white/55"
          variant="outline"
        >
          <AddSVG /> Add Variable
        </Button>
      </DialogTrigger>
      <DialogContent className="h-[40rem] w-[31.625rem] bg-[#18181B] text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">
            Add a new variable
          </DialogTitle>
          <DialogDescription>
            Add a new variable to the project
          </DialogDescription>
        </DialogHeader>

        <div className="text-white space-y-4">
          {/* Variable Name Field */}
          <div className="flex items-center gap-6">
            <label className="w-[7.125rem] text-base font-semibold" htmlFor="variableName">
              Variable Name
            </label>
            <Input
              className="w-[20rem] border border-white/10 bg-neutral-800 text-gray-300"
              id="variableName"
              onChange={(e) => setNewVariableData(prev => ({
                ...prev,
                variableName: e.target.value
              }))}
              placeholder="Enter variable key"
              value={newVariableData.variableName}
            />
          </div>

          {/* Extra Note Field */}
          <div className="flex items-center gap-6">
            <label className="w-[7.125rem] text-base font-semibold" htmlFor="note">
              Extra Note
            </label>
            <Input
              className="w-[20rem] border border-white/10 bg-neutral-800 text-gray-300"
              id="note"
              onChange={(e) => setNewVariableData(prev => ({
                ...prev,
                note: e.target.value
              }))}
              placeholder="Add optional note"
              value={newVariableData.note}
            />
          </div>

          {/* Environment Values Section */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold">Environment Values</h3>
            <div className="space-y-4 max-h-[20rem] overflow-y-auto">
              {environments.map((env) => (
                <div className="flex items-center gap-4" key={env.slug}>
                  <label className="sr-only" htmlFor={`env-${env.slug}`}>
                    {env.name}
                  </label>
                  <Input
                    className="w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300"
                    readOnly
                    value={env.name}
                  />
                  <Input
                    className="w-[13.5rem] border border-white/10 bg-neutral-800 text-gray-300"
                    id={`env-${env.slug}`}
                    onChange={(e) => setNewVariableData(prev => ({
                      ...prev,
                      environmentEntries: {
                        ...prev.environmentEntries,
                        [env.slug]: e.target.value
                      }
                    }))}
                    placeholder={`Value for ${env.name}`}
                    value={newVariableData.environmentEntries[env.slug] || ''}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              className="h-[2.625rem] w-[6.25rem] bg-white text-black hover:bg-gray-200"
              disabled={isLoading}
              onClick={handleAddVariable}
            >
              {isLoading ? 'Adding...' : 'Add Variable'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
