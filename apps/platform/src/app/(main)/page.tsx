'use client'
import { useEffect, useMemo, useState } from 'react'
import type { GetAllProjectsResponse } from '@keyshade/schema'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { FolderSVG } from '@public/svg/dashboard'
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
import { useHttp } from '@/hooks/use-http'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'

function ProjectItemComponent(item: GetAllProjectsResponse['items'][number]) {
  return <ProjectCard project={item} />
}
export default function Index(): JSX.Element {
  const [loading, setLoading] = useState<boolean>(true)

  const setUser = useSetAtom(userAtom)
  const setIsCreateProjectDialogOpen = useSetAtom(createProjectOpenAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const isDeleteProjectOpen = useAtomValue(deleteProjectOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  // Projects to be displayed in the dashboard
  const [projects, setProjects] = useAtom(projectsOfWorkspaceAtom)

  const isProjectsEmpty = useMemo(() => projects.length === 0, [projects])

  const getAllProjects = useHttp(() =>
    ControllerInstance.getInstance().projectController.getAllProjects({
      workspaceSlug: selectedWorkspace!.slug
    })
  )

  const getSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.getSelf()
  )

  useEffect(() => {
    selectedWorkspace &&
      getAllProjects()
        .then(({ data, success }) => {
          if (success && data) {
            setProjects(data.items)
          }
        })
        .finally(() => {
          setLoading(false)
        })

    getSelf().then(({ data, success }) => {
      if (success && data) {
        setUser(data)
      }
    })
  }, [getAllProjects, selectedWorkspace, setProjects, getSelf, setUser])

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
        <InfiniteScrollList<GetAllProjectsResponse['items'][number]>
          className="grid grid-cols-1 gap-5 p-2 md:grid-cols-2 xl:grid-cols-3"
          fetchFunction={async ({
            page,
            limit
          }: {
            page: number
            limit: number
          }) => {
            const response =
              await ControllerInstance.getInstance().projectController.getAllProjects(
                {
                  workspaceSlug: selectedWorkspace!.slug,
                  page,
                  limit
                }
              )

            return {
              success: response.success,
              error: response.error
                ? { message: response.error.message }
                : undefined,
              data: response.data ?? {
                items: [],
                metadata: { totalCount: 0 }
              }
            }
          }}
          itemComponent={ProjectItemComponent}
          itemKey={(item) => item.id}
          itemsPerPage={10}
        />
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

      {isDeleteProjectOpen && selectedProject ? <ConfirmDeleteProject /> : null}

      <EditProjectSheet />
    </div>
  )
}
