'use client'
import React, { useEffect } from 'react'
import type { GetAllProjectsResponse } from '@keyshade/schema'
import { useAtomValue, useSetAtom } from 'jotai'
import ProjectCard from '@/components/dashboard/project/projectCard'
import ControllerInstance from '@/lib/controller-instance'
import CreateProjectDialogue from '@/components/dashboard/project/createProjectDialogue'
import {
  selectedWorkspaceAtom,
  deleteProjectOpenAtom,
  selectedProjectAtom,
  userAtom
} from '@/store'
import EditProjectSheet from '@/components/dashboard/project/editProjectSheet'
import ExportProjectConfigurationsDialog from '@/components/dashboard/project/exportProjectConfigurations'
import ConfirmDeleteProject from '@/components/dashboard/project/confirmDeleteProject'
import { useHttp } from '@/hooks/use-http'
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import { PageTitle } from '@/components/common/page-title'
import { useGetAllProjects } from '@/hooks/api/use-get-all-projects'
import ProjectLoader from '@/components/main/ProjectLoader'
import ProjectEmpty from '@/components/main/ProjectEmpty'
import Visible from '@/components/common/visible'

function ProjectItemComponent(item: GetAllProjectsResponse['items'][number]) {
  return <ProjectCard project={item} />
}

export default function Index(): React.JSX.Element {
  const setUser = useSetAtom(userAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const isDeleteProjectOpen = useAtomValue(deleteProjectOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)

  const isAuthorizedToViewProject =
    selectedWorkspace?.entitlements.canReadProjects

  const { loading, isProjectsEmpty, fetchProjects } = useGetAllProjects()

  const getSelf = useHttp(() =>
    ControllerInstance.getInstance().userController.getSelf()
  )

  useEffect(() => {
    getSelf().then(({ data, success }) => {
      if (success && data) {
        setUser(data)
      }
    })
  }, [getSelf, setUser])

  return (
    <div className="flex flex-col gap-4">
      <PageTitle title={`${selectedWorkspace?.name ?? ''} | Dashboard`} />
      <div className="flex items-center justify-between">
        <Visible if={!isProjectsEmpty}>
          <h1 className="text-[1.75rem] font-semibold ">My Projects</h1>
        </Visible>
        <CreateProjectDialogue />
      </div>

      <ProjectLoader loading={loading}>
        {isAuthorizedToViewProject ? (
          <ProjectEmpty isEmpty={isProjectsEmpty}>
            <InfiniteScrollList<GetAllProjectsResponse['items'][number]>
              className="grid grid-cols-1 gap-5 p-2 md:grid-cols-2 xl:grid-cols-3"
              fetchFunction={fetchProjects}
              itemComponent={ProjectItemComponent}
              itemKey={(item) => item.id}
              itemsPerPage={15}
            />
          </ProjectEmpty>
        ) : (
          <div>you don&apos;t have permission to view these projects</div>
        )}
      </ProjectLoader>

      <Visible if={Boolean(isDeleteProjectOpen && selectedProject)}>
        <ConfirmDeleteProject />
      </Visible>

      <EditProjectSheet />
      <ExportProjectConfigurationsDialog />
    </div>
  )
}
