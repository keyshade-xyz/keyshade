import { useAtom } from 'jotai'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { editProjectOpenAtom, selectedProjectAtom } from '@/store'
import { ProjectController } from '@keyshade/api-client'

interface FormData {
  name: string
  description: string
  storePrivateKey: boolean
}

export default function EditProjectSheet(): JSX.Element {
  const [isEditProjectSheetOpen, setIsEditProjectSheetOpen] =
    useAtom(editProjectOpenAtom)
  const [selectedProject] = useAtom(selectedProjectAtom)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    storePrivateKey: false
  })

  const [initialData, setInitialData] = useState<FormData>({
    name: '',
    description: '',
    storePrivateKey: false
  })

  useEffect(() => {
    if (selectedProject) {
      const newData = {
        name: selectedProject.name || '',
        description: selectedProject.description || '',
        storePrivateKey: selectedProject.storePrivateKey || false
      }
      setFormData(newData)
      setInitialData(newData)
    }
  }, [selectedProject])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [id]: value
    }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      storePrivateKey: checked
    }))
  }

  const getChangedFields = () => {
    const changes: Partial<FormData> = {}

    // Only include fields that have actually changed
    if (formData.name !== initialData.name) {
      changes.name = formData.name.trim()
    }
    if (formData.description !== initialData.description) {
      changes.description = formData.description.trim()
    }
    if (formData.storePrivateKey !== initialData.storePrivateKey) {
      changes.storePrivateKey = formData.storePrivateKey
    }

    return changes
  }

  const handleSubmit = async () => {
    if (!selectedProject?.slug) {
      toast.error('No project selected')
      return
    }

    const changes = getChangedFields()

    if (Object.keys(changes).length === 0) {
      toast.info('No changes to save')
      return
    }

    if (changes.name !== undefined && !changes.name) {
      toast.error('Project name is required')
      return
    }

    try {
      setIsLoading(true)

      const projectController = new ProjectController(
        process.env.NEXT_PUBLIC_BACKEND_URL || ''
      )

      const response = await projectController.updateProject({
        projectSlug: selectedProject.slug,
        ...changes
      })

      if (!response) {
        throw new Error('No response received from server')
      }

      if (response.success) {
        toast.success('Project updated successfully')
        setIsEditProjectSheetOpen(false)
        window.location.reload()

      } else {
        if (response.error?.statusCode === 404) {
          toast.error(
            'Project not found. It may have been deleted or you may not have access.'
          )
        } else if (response.error?.message?.includes('already exists')) {
          toast.error(
            'A project with this name already exists. Please choose a different name.'
          )
        } else {
          toast.error(response.error?.message || 'Failed to update project')
        }
      }
    } catch (error) {
      console.error('Update project error:', error)

      if (error instanceof Response && error.status === 404) {
        toast.error('Project not found. Please refresh the page and try again.')
      } else if (error instanceof SyntaxError) {
        toast.error('Invalid response from server. Please try again later.')
      } else if (error instanceof Error) {
        toast.error(`Error: ${error.message}`)
      } else {
        toast.error('An unexpected error occurred while updating the project')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSheetChange = (open: boolean) => {
    setIsEditProjectSheetOpen(open)
    if (!open && selectedProject) {
      const resetData = {
        name: selectedProject.name || '',
        description: selectedProject.description || '',
        storePrivateKey: selectedProject.storePrivateKey || false
      }
      setFormData(resetData)
      setInitialData(resetData)
    }
  }


  return (
    <Sheet open={isEditProjectSheetOpen} onOpenChange={handleSheetChange}>
      <SheetContent className="border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Edit Project</SheetTitle>
          <SheetDescription>
            Make changes to the project details
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-start gap-4">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              className="col-span-3"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter project name"
            />
          </div>
          <div className="flex flex-col items-start gap-4">
            <Label htmlFor="description">Project Description</Label>
            <Input
              id="description"
              className="col-span-3"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter project description"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="w-[10rem] text-left" htmlFor="storePrivateKey">
              Do you want us to store the private key?
            </Label>
            <div className="flex gap-1 text-sm">
              <div>No</div>
              <Switch
                id="storePrivateKey"
                checked={formData.storePrivateKey}
                onCheckedChange={handleSwitchChange}
              />
              <div>Yes</div>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button
            type="submit"
            variant="secondary"
            disabled={isLoading}
            onClick={handleSubmit}
          >
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}