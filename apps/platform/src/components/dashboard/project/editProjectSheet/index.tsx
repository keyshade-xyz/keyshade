import { useAtom } from 'jotai'
import { useState, useEffect, useCallback } from 'react'
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
import { useHttp } from '@/hooks/use-http'

export default function EditProjectSheet(): JSX.Element {
  const [isEditProjectSheetOpen, setIsEditProjectSheetOpen] =
    useAtom(editProjectOpenAtom)
  const [selectedProject, setSelectedProject] = useAtom(selectedProjectAtom)
  const [projects, setProjects] = useAtom(projectsOfWorkspaceAtom)

  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<
    Omit<UpdateProjectRequest, 'projectSlug'>
  >({
    name: '',
    description: '',
    storePrivateKey: false
  })

  const updateProject = useHttp(() =>
    ControllerInstance.getInstance().projectController.updateProject({
      projectSlug: selectedProject!.slug,
      ...formData
    })
  )

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

  const handleUpdateProject = useCallback(async () => {
    if (selectedProject) {
      setIsLoading(true)
      toast.loading('Updating project...')

      try {
        const { data, success } = await updateProject()

        if (success && data) {
          setProjects(
            projects.map((project) =>
              project.slug === selectedProject.slug
                ? { ...project, ...data }
                : project
            )
          )

          toast.success('Project updated successfully')
        }
      } finally {
        setIsEditProjectSheetOpen(false)
        setSelectedProject(null)
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    selectedProject,
    updateProject,
    setProjects,
    projects,
    setIsEditProjectSheetOpen,
    setSelectedProject
  ])

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
    <Sheet onOpenChange={handleSheetChange} open={isEditProjectSheetOpen}>
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
              className="col-span-3"
              id="name"
              onChange={handleInputChange}
              placeholder="Enter project name"
              value={formData.name}
            />
          </div>
          <div className="flex flex-col items-start gap-4">
            <Label htmlFor="description">Project Description</Label>
            <Input
              className="col-span-3"
              id="description"
              onChange={handleInputChange}
              placeholder="Enter project description"
              value={formData.description}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="w-[10rem] text-left" htmlFor="storePrivateKey">
              Do you want us to store the private key?
            </Label>
            <div className="flex gap-1 text-sm">
              <div>No</div>
              <Switch
                checked={formData.storePrivateKey}
                id="storePrivateKey"
                onCheckedChange={handleSwitchChange}
              />
              <div>Yes</div>
            </div>
          </div>
        </div>
        <SheetFooter>
          <Button
            disabled={isLoading}
            onClick={handleUpdateProject}
            type="submit"
            variant="secondary"
          >
            {isLoading ? 'Saving...' : 'Save changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
