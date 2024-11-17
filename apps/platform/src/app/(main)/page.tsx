'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { CreateProjectRequest, CreateProjectResponse } from '@keyshade/api-client';
import type { Workspace } from '@keyshade/schema'
import ProjectController from '@keyshade/api-client'
import { AddSVG } from '@public/svg/shared'
import ProjectCard from '@/components/dashboard/projectCard'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
  // SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue, } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type { NewProject, ProjectWithoutKeys } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTrigger
} from '@/components/ui/dialog'
import { Projects } from '@/lib/api-functions/projects'

export default function Index(): JSX.Element {
  const [isSheetOpen, setIsSheetOpen] = useState<boolean>(false)
  const [projects, setProjects] = useState<ProjectWithoutKeys[] | []>([])
  const [newProjectData, setNewProjectData] = useState<NewProject>({
    name: '',
    description: '',
    storePrivateKey: false,
    environments: [
      {
        name: '',
        description: '',
        isDefault: false,
      },
    ],
    accessLevel: 'GLOBAL'
  })

  const router = useRouter()

  

  const createNewProject = async () => {

    const projectController = new ProjectController(process.env.NEXT_PUBLIC_BACKEND_URL);

    const request: CreateProjectRequest = {
      name: newProjectData.name,
      workspaceSlug: currentWorkspace.slug,
      description: newProjectData.description ?? undefined,
      environments: newProjectData.environments,
      accessLevel: newProjectData.accessLevel
    }

    const response = await projectController.createProject(request);

    if( response.success ){

      const createdProject: ProjectWithoutKeys = {
        id: response.data.id,
        name: response.data.name,
        description: response.data.description,
        createdAt: response.data.createdAt,
        updatedAt: response.data.updatedAt,
        storePrivateKey: response.data.storePrivateKey,
        isDisabled: response.data.isDisabled,
        accessLevel: response.data.accessLevel,
        lastUpdatedById: response.data.lastUpdatedById,
        workspaceId: response.data.workspaceId,
        isForked: response.data.isForked,
        forkedFromId: response.data.forkedFromId,
      }

      setProjects((prevProjects) => [...prevProjects, createdProject]);

    }

  }

  const currentWorkspace: Workspace =
    typeof localStorage !== 'undefined'
      ? (JSON.parse(
          localStorage.getItem('currentWorkspace') ?? '{}'
        ) as Workspace)
      : (JSON.parse(`{}`) as Workspace)

  useEffect(() => {
    Projects.getProjectsbyWorkspaceID(currentWorkspace.id)
      .then((data: ProjectWithoutKeys[] | [] | undefined) => {
        if (data) {
          setProjects(data)
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      })
  }, [currentWorkspace.id])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[1.75rem] font-semibold ">My Projects</h1>

        <Dialog>
          <DialogTrigger>
            <Button>
              {' '}
              <AddSVG /> Create a new Project
            </Button>
          </DialogTrigger>
          <DialogContent className='h-[39.5rem] w-[28.625rem] bg-[#1E1E1F] border rounded-[12px] '>

            <div className='h-[3.125rem] w-[25.625rem] flex flex-col justify-center items-start'>
              <DialogHeader className=' h-[1.875rem] w-[8.5rem] font-geist font-semibold text-white text-[1.125rem] '
              >
                Create Projects
              </DialogHeader>

              <DialogDescription className=' h-[1.25rem] w-[25.625rem] font-inter font-normal text-[#D4D4D4] text-[0.875rem]'>
                Create your new project
              </DialogDescription>

            </div>
            <div className="flex flex-col gap-y-8">

              <div className="h-[29.125rem] w-[25.813rem] flex flex-col py-[1rem] gap-[1rem] ">

                {/* NAME */}
                <div className="flex justify-center items-center h-[2.25rem] w-[25.813rem] gap-[1rem]">
                  <Label className="text-left h-[1.25rem] w-[4.813rem] font-geist font-[500] text-[0.875rem] gap-[0.25rem] " htmlFor="name">
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
                <div className="flex h-[5.625rem] w-[25.813rem] gap-[1rem] justify-center items-center">
                  <Label className="text-left h-[1.25rem] w-[4.813rem] font-geist font-[500] text-[0.875rem] gap-[0.25rem] " htmlFor="name">
                    Description
                  </Label>
                  <Input
                    className="col-span-3 h-[5.625rem] w-[20rem] gap-[0.25rem]"
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
                <div className="flex justify-center items-center h-[2.25rem] w-[25.813rem] gap-[1rem]">
                  <Label className="text-left h-[1.25rem] w-[4.813rem] font-geist font-[500] text-[0.875rem] gap-[0.25rem] " htmlFor="envName">
                    Env. Name
                  </Label>
                  <Input
                    className="col-span-3 h-[2.25rem] w-[20rem] "
                    id="envName"
                    onChange={(e) => {
                      setNewProjectData((prev) => ({
                        ...prev,
                        envName: e.target.value
                      }))
                    }}
                    placeholder="Your project default environment name"
                  />
                </div>
                
                {/* ENV. DESCRIPTION */}
                <div className="flex justify-center items-center h-[4.875rem] w-[25.813rem] gap-[1rem]">
                  <Label className="text-left h-[1.25rem] w-[4.813rem] font-geist font-[500] text-[0.875rem] gap-[0.25rem]" htmlFor="envDescription">
                    Env. Description
                  </Label>
                  <Input
                    className="col-span-3 h-[4.875rem] w-[20rem] "
                    id="envDescription"
                    onChange={(e) => {
                      setNewProjectData((prev) => ({
                        ...prev,
                        envDescription: e.target.value
                      }))
                    }}
                    placeholder="Detailed description about your environment"
                  />
                </div>

                {/* ACCESS LEVEL */}
                <div className="flex justify-center items-center h-[2.25rem] w-[25.813rem] gap-[1rem]">
                  <Label className="text-left h-[0.875rem] w-[5.5rem] font-geist font-[500] text-[0.875rem] gap-[0.25rem] " htmlFor="accessLevel">
                    Access Level
                  </Label>
                  <Select defaultValue="GLOBAL"
                  onValueChange={(currValue) =>
                    { setNewProjectData((prevData) => ({
                      ...prevData,
                      accessLevel: currValue as "GLOBAL" | "INTERNAL" | "PRIVATE",
                    })); }
                  }
                  >
                    <SelectTrigger className=" h-[2.25rem] w-[20rem] border-[0.013rem] border-white/10 rounded-[0.375rem] focus:border-[#3b82f6]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-[0.013rem] border-white/10 text-white ">
                      <SelectGroup>
                        {["Global", "Internal", "Private"].map((accessValue) => (
                          <SelectItem
                            className="group rounded-sm cursor-pointer"
                            key={accessValue.toLowerCase()}
                            value={accessValue.toLowerCase()}
                          >
                              {accessValue} 
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center items-center h-[4.875rem] w-[25.813rem] gap-[1rem]">

                  <div className='h-[2.875rem] w-[22.563rem] flex flex-col justify-center items-start'>
                    <h1 className='h-[1.5rem] w-[18.688rem] font-geist font-[500] text-[1rem]'>
                      Should the private key be saved or not?
                    </h1>
                    <h1 className='h-[1.25rem] w-[16.563rem] font-inter font-normal text-[0.8rem] text-[#A1A1AA] '>
                      Choose if you want to save your private key
                    </h1>

                  </div>
                  
                  <div className='p-[0.125rem]'>
                    <Switch className='h-[1.25rem] w-[2.25rem] ' />
                  </div>

                </div>

              </div>
            </div>
            <div className="h-[2.25rem] w-[25.625rem] flex justify-end">
              <Button
                className='h-[2.25rem] w-[8rem] rounded-[0.375rem] font-inter font-[500] text-[0.875rem]'
                onClick={ () => void createNewProject() }
                variant="secondary"
              >
                Create project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {projects.length !== 0 ? (
        <div className="grid h-[70vh] gap-6 overflow-y-auto scroll-smooth p-2 md:grid-cols-2 2xl:grid-cols-3">
          {projects.map((project: ProjectWithoutKeys) => {
            return (
              <ProjectCard
                config={10}
                description={project.description ?? ''}
                environment={2}
                id={project.id}
                key={project.id}
                secret={5}
                setIsSheetOpen={setIsSheetOpen}
                title={project.name}
              />
            )
          })}
        </div>
      ) : (
        <div className="mt-[10vh] flex justify-center">
          <div>No projects yet? Get started by creating a new project.</div>
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
