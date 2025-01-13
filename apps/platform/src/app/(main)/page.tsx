'use client'
import { useEffect, useMemo, useState } from 'react'
import type { GetAllProjectsResponse } from '@keyshade/schema'
import { FolderSVG } from '@public/svg/dashboard'
import { toast } from 'sonner'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import ProjectCard from '@/components/dashboard/project/projectCard'
import ControllerInstance from '@/lib/controller-instance'
import ProjectScreenLoader from '@/components/ui/project-screen-loader'
import CreateProjectDialogue from '@/components/dashboard/project/createProjectDialogue'
import {
  createProjectDialogOpenAtom,
  currentWorkspaceAtom,
  projectsOfWorkspaceAtom
} from '@/store'
import EditProjectSheet from '@/components/dashboard/project/editProjectSheet'
import { Button } from '@/components/ui/button'

export default function Index(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false)

  const setIsCreateProjectDialogOpen = useSetAtom(createProjectDialogOpenAtom)
  const currentWorkspace = useAtomValue(currentWorkspaceAtom)

  // Projects to be displayed in the dashboard
  const [projects, setProjects] = useAtom(projectsOfWorkspaceAtom)
  const isProjectsEmpty = useMemo(() => projects.length === 0, [projects])

  // If a workspace is selected, we want to fetch all the projects
  // under that workspace and display it in the dashboard.
  useEffect(() => {
    async function getAllProjects() {
      setLoading(true)

      if (currentWorkspace) {
        const { success, error, data } =
          await ControllerInstance.getInstance().projectController.getAllProjects(
            { workspaceSlug: currentWorkspace.slug },
            {}
          )

        if (success && data) {
          setProjects(data.items)
        } else {
          toast.error(
            'Something went wrong while fetching projects. Check console for more info.'
          )
          // eslint-disable-next-line no-console -- we need to log the error
          console.error(error)
        }
      }

      setLoading(false)
    }

    getAllProjects()
  }, [currentWorkspace, setProjects])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        {!isProjectsEmpty && (
          <h1 className="text-[1.75rem] font-semibold ">My Projects</h1>
        )}
        <CreateProjectDialogue />
      </div>

      {loading ? (
        <ProjectScreenLoader />
      ) : !isProjectsEmpty ? (
        <div className="grid grid-cols-1 gap-5 overflow-y-scroll scroll-smooth p-2 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project: GetAllProjectsResponse['items'][number]) => {
            return <ProjectCard key={project.id} project={project} />
          })}
        </div>
      ) : (
        <div className="mt-[10vh] flex h-[40vh] flex-col items-center justify-center gap-y-4">
          <FolderSVG width="150" />
          <div className="text-4xl">Start your First Project</div>
          <div>
            Create a project and start setting up your variables and secret keys
          </div>
          <Button
            onClick={() => setIsCreateProjectDialogOpen(true)}
            variant="secondary"
          >
            Create project
          </Button>
        </div>
      )}

      <EditProjectSheet />
    </div>
  )
}
