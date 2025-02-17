'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { GetAllProjectsResponse } from '@keyshade/schema'
import { FolderSVG } from '@public/svg/dashboard'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import ProjectCard from '@/components/dashboard/project/projectCard'
import ControllerInstance from '@/lib/controller-instance'
import ProjectScreenLoader from '@/components/dashboard/project/projectScreenLoader'
import CreateProjectDialogue from '@/components/dashboard/project/createProjectDialogue'
import {
  createProjectOpenAtom,
  selectedWorkspaceAtom,
  projectsOfWorkspaceAtom,
  deleteProjectOpenAtom,
  selectedProjectAtom,
  userAtom
} from '@/store'
import EditProjectSheet from '@/components/dashboard/project/editProjectSheet'
import { Button } from '@/components/ui/button'
import ConfirmDeleteProject from '@/components/dashboard/project/confirmDeleteProject'

export default function Index(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false)
  const setUser = useSetAtom(userAtom)

  const setIsCreateProjectDialogOpen = useSetAtom(createProjectOpenAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const isDeleteProjectOpen = useAtomValue(deleteProjectOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  // Projects to be displayed in the dashboard
  const [projects, setProjects] = useAtom(projectsOfWorkspaceAtom)
  const isProjectsEmpty = useMemo(() => projects.length === 0, [projects])

  const getAllProjects = useCallback(async () => {
    setLoading(true)

    if (selectedWorkspace) {
      const { success, error, data } =
        await ControllerInstance.getInstance().projectController.getAllProjects(
          { workspaceSlug: selectedWorkspace.slug },
          {}
        )

      if (success && data) {
        setProjects(data.items)
      } else {
        throw new Error(JSON.stringify(error))
      }
    }

    setLoading(false)
  }, [selectedWorkspace, setProjects])

  const getSelf = useCallback(async () => {
    const { success, error, data } =
      await ControllerInstance.getInstance().userController.getSelf()
    if (success && data) {
      setUser(data)
    } else {
      toast.error('Something went wrong!', {
        description: (
          <p className="text-xs text-red-300">
            Something went wrong while fetching user. Check console for more
            info.
          </p>
        )
      })
      // eslint-disable-next-line no-console -- we need to log the error
      console.error(error)
    }
  }, [setUser])

  useEffect(() => {
    getAllProjects()
    getSelf()
  }, [getAllProjects, selectedWorkspace, setProjects, getSelf])

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

      {isDeleteProjectOpen && selectedProject ? (
        <ConfirmDeleteProject reCallGetAllProjects={getAllProjects} />
      ) : null}

      <EditProjectSheet />
    </div>
  )
}
