'use client'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
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
  // SheetTrigger
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { NewProject, ProjectWithoutKeys, Workspace } from '@/types'
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
  const [isProjectEmpty, setIsProjectEmpty] = useState(true)
  const [projects, setProjects] = useState<ProjectWithoutKeys[] | []>([])
  const [newProjectData, setNewProjectData] = useState<NewProject>({
    name: '',
    description: '',
    storePrivateKey: false,
    environments: [
      {
        name: 'Dev',
        description: 'Development environment',
        isDefault: true
      },
      {
        name: 'Stage',
        description: 'Staging environment',
        isDefault: false
      },
      {
        name: 'Prod',
        description: 'Production environment',
        isDefault: false
      }
    ]
  })

  const router = useRouter()

  const currentWorkspace =
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
          setIsProjectEmpty(data.length === 0)
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
        {!isProjectEmpty && (
          <h1 className="text-[1.75rem] font-semibold ">My Projects</h1>
        )}

        <Dialog>
          {!isProjectEmpty && (
            <DialogTrigger>
              <Button>
                {' '}
                <AddSVG /> Create a new Project
              </Button>
            </DialogTrigger>
          )}

          <DialogContent>
            <DialogHeader>Create a new project</DialogHeader>
            <DialogDescription>
              Fill in the details to create a new project
            </DialogDescription>
            <div className="flex flex-col gap-y-8">
              <div className="flex w-full flex-col gap-y-4">
                <div className="flex flex-col items-start gap-4">
                  <Label className="text-right" htmlFor="name">
                    Name
                  </Label>
                  <Input
                    className="col-span-3"
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
                <div className="flex flex-col items-start gap-4">
                  <Label className="text-right" htmlFor="name">
                    Description
                  </Label>
                  <Input
                    className="col-span-3"
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
                {/* {isNameEmpty ? (
                  <span className="ml-[3.5rem] mt-1 text-red-500">
                    Name cannot be empty
                  </span>
                ) : null} */}
              </div>
            </div>
            <div className="flex w-full justify-end">
              <Button
                onClick={() => {
                  Projects.createProject(newProjectData, currentWorkspace.id)
                    .then(() => {
                      toast.success('New project added successfully')
                      router.refresh()
                    })
                    .catch(() => {
                      toast.error('Failed to add new project')
                    })
                }}
                variant="secondary"
              >
                Add project
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!isProjectEmpty ? (
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
        <div className="mt-[10vh] flex h-[40vh] flex-col items-center justify-center gap-y-4">
          <FolderSVG width="150" />
          <div className="text-4xl">Start your First Project</div>
          <div>
            Create a file and start setting up your environment and secret keys
          </div>
          <Button variant="secondary">Create project</Button>
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
