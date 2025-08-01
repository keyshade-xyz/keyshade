'use client'
import { useEffect, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { useSearchParams } from 'next/navigation'
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
import { InfiniteScrollList } from '@/components/ui/infinite-scroll-list'
import { cn } from '@/lib/utils'
import { PageTitle } from '@/components/common/page-title'
import ProjectErrorCard from '@/components/shared/project-error-card'

function EnvironmentItemComponent({
  item,
  highlightSlug,
  isHighlighted
}: {
  item: GetAllEnvironmentsOfProjectResponse['items'][number]
  highlightSlug: string | null
  isHighlighted: boolean
}) {
  return (
    <EnvironmentCard
      className={cn(
        highlightSlug === item.slug && isHighlighted && 'animate-highlight'
      )}
      environment={item}
    />
  )
}

/**
 *
 * This will prevent React from treating it as a new component on every render,
 * which can lead to performance issues and loss of state.
 */
function renderEnvironmentItemComponent(
  item: GetAllEnvironmentsOfProjectResponse['items'][number],
  highlightSlug: string | null,
  isHighlighted: boolean
) {
  return (
    <EnvironmentItemComponent
      highlightSlug={highlightSlug}
      isHighlighted={isHighlighted}
      item={item}
    />
  )
}

function EnvironmentPage(): React.JSX.Element {
  const searchParams = useSearchParams()
  const highlightSlug = searchParams.get('highlight')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isHighlighted, setIsHighlighted] = useState(false)

  const isDeleteEnvironmentOpen = useAtomValue(deleteEnvironmentOpenAtom)
  const isEditEnvironmentOpen = useAtomValue(editEnvironmentOpenAtom)
  const [environments, setEnvironments] = useAtom(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const selectedEnvironment = useAtomValue(selectedEnvironmentAtom)

  const isAuthorizedToReadEnvironments =
    selectedProject?.entitlements.canReadEnvironments

  const getAllEnvironmentsOfProject = useHttp(() =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: selectedProject!.slug,
        limit: ENVIRONMENTS_PAGE_SIZE
      }
    )
  )

  useEffect(() => {
    if (selectedProject && isAuthorizedToReadEnvironments) {
      setIsLoading(true)

      getAllEnvironmentsOfProject().finally(() => setIsLoading(false))
    }
  }, [
    getAllEnvironmentsOfProject,
    selectedProject,
    setEnvironments,
    isAuthorizedToReadEnvironments
  ])

  useEffect(() => {
    if (highlightSlug) {
      // Find and scroll to the element
      const element = document.getElementById(`environment-${highlightSlug}`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setIsHighlighted(true)

        // Remove highlight after animation
        setTimeout(() => {
          setIsHighlighted(false)
        }, 2000)
      }
    }
  }, [highlightSlug, environments])

  if (!isAuthorizedToReadEnvironments) {
    return <ProjectErrorCard tab="environments" />
  }

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
      <PageTitle title={`${selectedProject.name} | Environments`} />
      {/* Showing this when there are no environments present */}
      {environments.length === 0 ? (
        <EmptyEnvironmentListContent />
      ) : (
        // Showing this when environments are present
        <div className="flex w-full flex-col gap-y-8">
          <div>
            <InfiniteScrollList<
              GetAllEnvironmentsOfProjectResponse['items'][number]
            >
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
                      projectSlug: selectedProject.slug,
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
              itemComponent={(item) =>
                renderEnvironmentItemComponent(
                  item,
                  highlightSlug,
                  isHighlighted
                )
              }
              itemKey={(item) => item.id}
              itemsPerPage={10}
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
