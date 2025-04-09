'use client'
import { useEffect, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import type { GetAllEnvironmentsOfProjectResponse } from '@keyshade/schema'
import {
  selectedProjectAtom,
  deleteEnvironmentOpenAtom,
  editEnvironmentOpenAtom,
  environmentsOfProjectAtom,
  selectedEnvironmentAtom
} from '@/store'
import EnvironmentCard from '@/components/dashboard/environment/environmentCard'
import ConfirmDeleteEnvironment from '@/components/dashboard/environment/confirmDeleteEnvironment'
import EditEnvironmentDialogue from '@/components/dashboard/environment/editEnvironmentSheet'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import { ENVIRONMENTS_PAGE_SIZE } from '@/lib/constants'
import { EnvironmentLoader } from '@/components/dashboard/environment/environmentLoader'
import EmptyEnvironmentListContent from '@/components/dashboard/environment/emptyEnvironmentListContent'
import { PaginatedList } from '@/components/ui/paginatedlist'

function EnvironmentItemComponent(
  item: GetAllEnvironmentsOfProjectResponse['items'][number]
) {
  return <EnvironmentCard environment={item} />
}

function EnvironmentPage(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const isDeleteEnvironmentOpen = useAtomValue(deleteEnvironmentOpenAtom)
  const isEditEnvironmentOpen = useAtomValue(editEnvironmentOpenAtom)
  const [environments, setEnvironments] = useAtom(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const selectedEnvironment = useAtomValue(selectedEnvironmentAtom)

  const getAllEnvironmentsOfProject = useHttp(() =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: selectedProject!.slug,
        limit: ENVIRONMENTS_PAGE_SIZE
      }
    )
  )

  useEffect(() => {
    if (selectedProject) {
      setIsLoading(true)

      getAllEnvironmentsOfProject()
      setIsLoading(false)
    }
  }, [getAllEnvironmentsOfProject, selectedProject, setEnvironments])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <EnvironmentLoader />
        <EnvironmentLoader />
        <EnvironmentLoader />
      </div>
    )
  }

  return (
    <div
      className={`flex h-full w-full ${isDeleteEnvironmentOpen ? 'inert' : ''} `}
    >
      {/* Showing this when there are no environments present */}
      {environments.length === 0 ? (
        <EmptyEnvironmentListContent />
      ) : (
        // Showing this when environments are present
        <div className="flex w-full flex-col gap-y-8">
          <div>
            <PaginatedList<GetAllEnvironmentsOfProjectResponse['items'][number]>
              className={`grid h-fit w-full grid-cols-1 gap-8 p-3 text-white md:grid-cols-2 xl:grid-cols-3 ${isDeleteEnvironmentOpen ? 'inert' : ''}`}
              fetchFunction={async ({
                page,
                limit
              }: {
                page: number
                limit: number
              }) => {
                const response =
                  await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
                    {
                      projectSlug: selectedProject!.slug,
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
              itemComponent={EnvironmentItemComponent}
              itemKey={(item) => item.id}
              itemsPerPage={3}
            />

            {/* Delete environment alert dialog */}
            {isDeleteEnvironmentOpen && selectedEnvironment ? (
              <ConfirmDeleteEnvironment />
            ) : null}

            {/* Edit environment dialog */}
            {isEditEnvironmentOpen && selectedEnvironment ? (
              <EditEnvironmentDialogue />
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnvironmentPage
