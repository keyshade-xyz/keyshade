import { useAtom } from 'jotai'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import type { UpdateProjectRequest } from '@keyshade/schema'

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
import { 
  editProjectOpenAtom, 
  selectedProjectAtom,
  projectsOfWorkspaceAtom 
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'

export default function EditProjectSheet(): JSX.Element {
  const [isEditProjectSheetOpen, setIsEditProjectSheetOpen] = useAtom(editProjectOpenAtom)
  const [selectedProject , setSelectedProject] = useAtom(selectedProjectAtom)
  const [projects, setProjects] = useAtom(projectsOfWorkspaceAtom)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<Omit<UpdateProjectRequest, 'projectSlug'>>({
    name: '',
    description: '',
    storePrivateKey: false
  })

  useEffect(() => {
    if (selectedProject) {
      setFormData({
        name: selectedProject.name || '',
        description: selectedProject.description || '',
        storePrivateKey: selectedProject.storePrivateKey || false
      })
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
    if (!selectedProject) return {}

    const changes: Partial<Omit<UpdateProjectRequest, 'projectSlug'>> = {}

    if (formData.name !== undefined && formData.name !== selectedProject.name) { 
      changes.name = formData.name.trim() 
    }
    
    if (formData.description !== undefined && formData.description!== selectedProject.description) {
      changes.description = formData.description.trim()
    }
    if (formData.storePrivateKey !== selectedProject.storePrivateKey) {
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

    if (changes.name !== undefined && changes.name === '') {
      toast.error('Project name is required')
      return
    }

    setIsLoading(true)
    
    const updateRequest: UpdateProjectRequest = {
      projectSlug: selectedProject.slug,
      ...changes
    }

    const { data, error, success } = await ControllerInstance.getInstance()
      .projectController.updateProject(updateRequest)

    if (success && data) {
      setProjects(projects.map(project => 
        project.slug === selectedProject.slug 
          ? { ...project, ...data }
          : project
      ))
      
      toast.success('Project updated successfully')
      setIsEditProjectSheetOpen(false)
      setSelectedProject(null)
    } else {
      toast.error('Failed to update project', {
        description: error?.message || 'An unexpected error occurred'
      })
      console.error(error)
    }

    setIsLoading(false)
  }

  const handleSheetChange = (open: boolean) => {
    setIsEditProjectSheetOpen(open)
    if (!open && selectedProject) {
      setFormData({
        name: selectedProject.name || '',
        description: selectedProject.description || '',
        storePrivateKey: selectedProject.storePrivateKey || false
      })
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