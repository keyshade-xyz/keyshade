'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type {
  CreateProjectRequest,
  GetAllProjectsResponse,
  ProjectWithCount,
  Workspace
} from '@keyshade/schema'
import { AddSVG } from '@public/svg/shared'
import { FolderSVG } from '@public/svg/dashboard'
import ProjectCard from '@/components/dashboard/projectCard'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger
} from '@/components/ui/dialog'
import ControllerInstance from '@/lib/controller-instance'
import { Textarea } from '@/components/ui/textarea'

export default function Index(): JSX.Element {
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false)
  const [isProjectEmpty, setIsProjectEmpty] = useState<boolean>(true)
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false)

  // Projects to be displayed in the dashboard
  const [projects, setProjects] = useState<ProjectWithCount[]>([])

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
    accessLevel: 'GLOBAL'
  })

  // Fetches the currently selected workspace from context
  const currentWorkspace: Workspace | null = useMemo(
    () =>
      typeof localStorage !== 'undefined'
        ? (JSON.parse(
            localStorage.getItem('currentWorkspace') ?? '{}'
          ) as Workspace)
        : null,
    []
  )

  // If a workspace is selected, we want to fetch all the projects
  // under that workspace and display it in the dashboard.
  useEffect(() => {
    async function getAllProjects() {
      if (currentWorkspace) {
        const { success, error, data } =
          await ControllerInstance.getInstance().projectController.getAllProjects(
            { workspaceSlug: currentWorkspace.slug },
            {}
          )

        if (success && data) {
          setProjects(data.items)
        } else {
          // eslint-disable-next-line no-console -- we need to log the error
          console.error(error)
        }
      }
    }

    getAllProjects()
  }, [currentWorkspace])

  // Check if the projects array is empty
  useEffect(() => setIsProjectEmpty(projects.length === 0), [projects])

  // Function to create a new project
  const createNewProject = useCallback(async () => {
    if (currentWorkspace) {
      newProjectData.workspaceSlug = currentWorkspace.slug

      const { data, error, success } =
        await ControllerInstance.getInstance().projectController.createProject(
          newProjectData,
          {}
        )

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
      } else {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }

      setIsDialogOpen(false)
    } else {
      throw new Error('No workspace selected')
    }
  }, [currentWorkspace, newProjectData, projects])

  const toggleDialog = useCallback(() => setIsDialogOpen((prev) => !prev), [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {!isProjectEmpty && (
          <h1 className="text-[1.75rem] font-semibold ">My Projects</h1>
        )}

        <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
          <DialogTrigger>
            {isProjectEmpty ? null : (
              <Button onClick={toggleDialog}>
                {' '}
                <AddSVG /> Create a new Project
              </Button>
            )}
          </DialogTrigger>
          <DialogContent className="h-[39.5rem] w-[28.625rem] rounded-[12px] border bg-[#1E1E1F] ">
            <div className="flex h-[3.125rem] w-[25.625rem] flex-col items-start justify-center">
              <DialogHeader className=" font-geist h-[1.875rem] w-[8.5rem] text-[1.125rem] font-semibold text-white ">
                Create Projects
              </DialogHeader>

              <DialogDescription className=" font-inter h-[1.25rem] w-[25.625rem] text-[0.875rem] font-normal text-[#D4D4D4]">
                Create your new project
              </DialogDescription>
            </div>
            <div className="flex flex-col gap-y-8">
              <div className="flex h-[29.125rem] w-[25.813rem] flex-col gap-[1rem] py-[1rem] ">
                {/* NAME */}
                <div className="flex h-[2.25rem] w-[25.813rem] items-center justify-center gap-[1rem]">
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
                <div className="flex h-[5.625rem] w-[25.813rem] items-center justify-center gap-[1rem]">
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
                <div className="flex h-[2.25rem] w-[25.813rem] items-center justify-center gap-[1rem]">
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
                        environments: (prev.environments || []).map(
                          (env, index) =>
                            index === 0 ? { ...env, name: e.target.value } : env
                        )
                      }))
                    }}
                    placeholder="Your project default environment name"
                  />
                </div>

                {/* ENV. DESCRIPTION */}
                <div className="flex h-[4.875rem] w-[25.813rem] items-center justify-center gap-[1rem]">
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
                        environments: (prev.environments || []).map(
                          (env, index) =>
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
                <div className="flex h-[2.25rem] w-[25.813rem] items-center justify-center gap-[1rem]">
                  <Label
                    className="font-geist h-[0.875rem] w-[5.5rem] gap-[0.25rem] text-left text-[0.875rem] font-[500] "
                    htmlFor="accessLevel"
                  >
                    Access Level
                  </Label>
                  <Select
                    defaultValue="GLOBAL"
                    onValueChange={(currValue) => {
                      setNewProjectData((prevData) => ({
                        ...prevData,
                        accessLevel: currValue as
                          | 'GLOBAL'
                          | 'INTERNAL'
                          | 'PRIVATE'
                      }))
                    }}
                  >
                    <SelectTrigger className=" h-[2.25rem] w-[20rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5 focus:border-[#3b82f6]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white ">
                      <SelectGroup>
                        {['GLOBAL', 'INTERNAL', 'PRIVATE'].map(
                          (accessValue) => (
                            <SelectItem
                              className="group cursor-pointer rounded-sm"
                              key={accessValue.toUpperCase()}
                              value={accessValue.toUpperCase()}
                            >
                              {accessValue}
                            </SelectItem>
                          )
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex h-[4.875rem] w-[25.813rem] items-center justify-center gap-[1rem]">
                  <div className="flex h-[2.875rem] w-[22.563rem] flex-col items-start justify-center">
                    <h1 className="font-geist h-[1.5rem] w-[18.688rem] text-[1rem] font-[500]">
                      Should the private key be saved or not?
                    </h1>
                    <h1 className="font-inter h-[1.25rem] w-[16.563rem] text-[0.8rem] font-normal text-[#A1A1AA] ">
                      Choose if you want to save your private key
                    </h1>
                  </div>

                  <div className="p-[0.125rem]">
                    <Switch className="h-[1.25rem] w-[2.25rem] " />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex h-[2.25rem] w-[25.625rem] justify-end">
              <Button
                className="font-inter h-[2.25rem] w-[8rem] rounded-[0.375rem] text-[0.875rem] font-[500]"
                onClick={createNewProject}
                variant="secondary"
              >
                Create project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!isProjectEmpty ? (
        <div className="grid grid-cols-1 gap-5 overflow-y-scroll scroll-smooth p-2 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project: GetAllProjectsResponse['items'][number]) => {
            return (
              <ProjectCard
                key={project.id}
                project={project}
                setIsSheetOpen={setIsSheetOpen}
              />
            )
          })}
        </div>
      ) : (
        <div className="mt-[10vh] flex h-[40vh] flex-col items-center justify-center gap-y-4">
          <FolderSVG width="150" />
          <div className="text-4xl">Start your First Project</div>
          <div>
            Create a file and start setting up your environment and secret keys
          </div>
          <Button onClick={toggleDialog} variant="secondary">
            Create project
          </Button>
        </div>
      )}

      <Sheet
        onOpenChange={(open) => {
          setIsSheetOpen(open)
        }}
        open={isSheetOpen}
      >
        <SheetContent className="border-white/15 bg-[#222425]">
          <SheetHeader>
            <SheetTitle className="text-white">Edit Project</SheetTitle>
            <SheetDescription>
              Make changes to the project details
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-start gap-4">
              <Label className="text-right" htmlFor="name">
                Project Name
              </Label>
              <Input className="col-span-3" id="name" />
            </div>
            <div className="flex flex-col items-start gap-4">
              <Label className="text-right" htmlFor="name">
                Project description
              </Label>
              <Input className="col-span-3" id="name" />
            </div>

            <div className="flex items-center justify-between">
              <Label className="w-[10rem] text-left" htmlFor="name">
                Do you want us to store the private key?
              </Label>
              <div className="flex gap-1 text-sm">
                <div>No</div>
                <Switch />
                <div>Yes</div>
              </div>
            </div>
          </div>
          <SheetFooter>
            <SheetClose asChild>
              <Button type="submit" variant="secondary">
                Save changes
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
