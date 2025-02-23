import type { CreateProjectRequest } from '@keyshade/schema'
import { toast } from 'sonner'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { AddSVG } from '@public/svg/shared'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import ControllerInstance from '@/lib/controller-instance'
import {
  createProjectOpenAtom,
  selectedWorkspaceAtom,
  projectsOfWorkspaceAtom
} from '@/store'
import { useHttp } from '@/hooks/use-http'

export default function CreateProjectDialogue(): JSX.Element {
  const privateKeyWarningRef = useRef<HTMLDivElement | null>(null)
  const [projects, setProjects] = useAtom(projectsOfWorkspaceAtom)
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useAtom(
    createProjectOpenAtom
  )
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  const isProjectsEmpty = useMemo(() => projects.length === 0, [projects])

  // Contains the data for the new project
  const [newProjectData, setNewProjectData] = useState<CreateProjectRequest>({
    name: '',
    workspaceSlug: '',
    description: '',
    storePrivateKey: false,
    environments: [
      {
        name: '',
        description: ''
      }
    ],
    accessLevel: 'PRIVATE'
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const createProject = useHttp(() =>
    ControllerInstance.getInstance().projectController.createProject({
      ...newProjectData,
      workspaceSlug: selectedWorkspace!.slug,
      environments:
        newProjectData.environments?.filter((env) => env.name.trim() !== '') ||
        []
    })
  )

  // Function to create a new project
  const handleCreateNewProject = useCallback(async () => {
    if (selectedWorkspace) {
      if (newProjectData.name.trim() === '') {
        toast.error('Project name cannot be empty')
        return
      }

      setIsLoading(true)
      toast.loading('Creating project...')

      try {
        const { data, success } = await createProject()

        if (success && data) {
          setProjects([
            ...projects,
            {
              ...data,
              environmentCount: newProjectData.environments
                ? newProjectData.environments.length
                : 0,
              secretCount: 0,
              variableCount: 0
            }
          ])
        }
      } finally {
        setIsCreateProjectDialogOpen(false)
        setIsLoading(false)
        toast.dismiss()
      }
    }
  }, [
    selectedWorkspace,
    newProjectData.name,
    newProjectData.environments,
    createProject,
    setProjects,
    projects,
    setIsCreateProjectDialogOpen
  ])

  const toggleDialog = useCallback(
    () => {
      setIsCreateProjectDialogOpen((prev) => !prev)
      if (!isCreateProjectDialogOpen) {
        setNewProjectData((prev) => ({ ...prev, storePrivateKey: false })) // Reset switch state
      }
    },
    [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen]
  )

  useEffect(() => {
    if (newProjectData.storePrivateKey && privateKeyWarningRef.current) {
      privateKeyWarningRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [newProjectData.storePrivateKey])

  return (
    <Dialog
      onOpenChange={setIsCreateProjectDialogOpen}
      open={isCreateProjectDialogOpen}
    >
      <DialogTrigger>
        {isProjectsEmpty ? null : (
          <Button onClick={toggleDialog}>
            <AddSVG /> Create a new Project
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="h-[39.5rem] w-full rounded-[12px] border bg-[#1E1E1F] ">
        <div className="flex h-[3.125rem] w-full flex-col items-start justify-center">
          <DialogHeader className=" font-geist h-[1.875rem] w-[8.5rem] text-[1.125rem] font-semibold text-white ">
            Create Project
          </DialogHeader>

          <DialogDescription className=" font-inter h-[1.25rem] w-full text-[0.875rem] font-normal text-[#D4D4D4]">
            Create your new project
          </DialogDescription>
        </div>
        <div className="flex flex-col gap-y-8 overflow-auto">
          <div className="flex h-[29.125rem] w-full flex-col gap-[1rem] py-[1rem] ">
            {/* NAME */}
            <div className="flex h-[2.25rem] w-full items-center justify-between gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[4.813rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="name"
              >
                Name
              </Label>
              <Input
                className="col-span-3 h-[2.25rem] w-[20rem] "
                id="name"
                onChange={(e) => {
                  setNewProjectData((prev) => ({
                    ...prev,
                    name: e.target.value
                  }))
                }}
                placeholder="Enter the name"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="flex h-[5.625rem] w-full items-center justify-between gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[4.813rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="name"
              >
                Description
              </Label>
              <Textarea
                className="col-span-3 h-[5.625rem] w-[20rem] resize-none gap-[0.25rem]"
                id="name"
                onChange={(e) => {
                  setNewProjectData((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }}
                placeholder="Enter the name"
              />
            </div>

            {/* ENV. NAME */}
            <div className="flex h-[2.25rem] w-full items-center justify-between gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[4.813rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="envName"
              >
                Env. Name
              </Label>
              <Input
                className="col-span-3 h-[2.25rem] w-[20rem] "
                id="envName"
                onChange={(e) => {
                  setNewProjectData((prev) => ({
                    ...prev,
                    environments: (prev.environments || []).map((env, index) =>
                      index === 0 ? { ...env, name: e.target.value } : env
                    )
                  }))
                }}
                placeholder="Your project default environment name"
              />
            </div>

            {/* ENV. DESCRIPTION */}
            <div className="flex h-[4.875rem] w-full items-center justify-between gap-[1rem]">
              <Label
                className="font-geist h-[1.25rem] w-[4.813rem] gap-[0.25rem] text-left text-[0.875rem] font-[500]"
                htmlFor="envDescription"
              >
                Env. Description
              </Label>
              <Textarea
                className="col-span-3 h-[4.875rem] w-[20rem] resize-none"
                id="envDescription"
                onChange={(e) => {
                  setNewProjectData((prev) => ({
                    ...prev,
                    environments: (prev.environments || []).map((env, index) =>
                      index === 0
                        ? { ...env, description: e.target.value }
                        : env
                    )
                  }))
                }}
                placeholder="Detailed description about your environment"
              />
            </div>

            {/* ACCESS LEVEL */}
            <div className="flex h-[2.25rem] w-full items-center justify-between gap-[1rem]">
              <Label
                className="font-geist h-[0.875rem] w-[5.5rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                htmlFor="accessLevel"
              >
                Access Level
              </Label>
              <Select
                onValueChange={(currValue) => {
                  setNewProjectData((prevData) => ({
                    ...prevData,
                    accessLevel: currValue as 'GLOBAL' | 'INTERNAL' | 'PRIVATE'
                  }))
                }}
                value={newProjectData.accessLevel}
              >
                <SelectTrigger className=" h-[2.25rem] w-[20rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5 focus:border-[#3b82f6]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white ">
                  <SelectGroup>
                    {['GLOBAL', 'INTERNAL', 'PRIVATE'].map((accessValue) => (
                      <SelectItem
                        className="group cursor-pointer rounded-sm"
                        key={accessValue.toUpperCase()}
                        value={accessValue.toUpperCase()}
                      >
                        {accessValue}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* SWITCH */}
            <div className="flex flex-col gap-y-4 pb-4">
              <div className="flex h-[4.875rem] w-full items-center justify-between gap-[1rem]">
                <div className="flex h-[2.875rem] w-[22.563rem] flex-col items-start justify-center">
                  <h1 className="font-geist h-[1.5rem] w-[18.688rem] text-[1rem] font-[500]">
                    Should the private key be saved or not?
                  </h1>
                  <h1 className="font-inter h-[1.25rem] w-[16.563rem] text-[0.8rem] font-normal text-[#A1A1AA] ">
                    Choose if you want to save your private key
                  </h1>
                </div>

                <div className="p-[0.125rem]">
                  <Switch
                    checked={newProjectData.storePrivateKey}
                    onCheckedChange={(checked) => {
                      setNewProjectData((prev) => ({
                        ...prev,
                        storePrivateKey: checked
                      }))
                    }}
                  />
                </div>
              </div>
              {
                newProjectData.storePrivateKey ? (
                  <div className="p-4 border border-yellow-300 rounded-lg" ref={privateKeyWarningRef}>
                    <p className="text-[0.8rem] font-normal text-[#A1A1AA]">Enabling this would save the private key in our database. This would allow all permissible members to read your secrets. In the unnatural event of a data breach, your secrets might be exposed to attackers. We recommend you to not save your private key.</p>
                  </div>
                ) : null
              }
            </div>
          </div>
        </div>
        <div className="flex h-[2.25rem] w-full justify-end">
          <Button
            className="font-inter h-[2.25rem] w-[8rem] rounded-[0.375rem] text-[0.875rem] font-[500]"
            disabled={isLoading}
            onClick={handleCreateNewProject}
            variant="secondary"
          >
            Create project
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
