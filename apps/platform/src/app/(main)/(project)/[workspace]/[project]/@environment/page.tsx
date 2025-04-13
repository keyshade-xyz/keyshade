'use client'

import { useEffect, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { useSearchParams } from 'next/navigation'
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
import { Button } from '@/components/ui/button'
import { useHttp } from '@/hooks/use-http'
import { ENVIRONMENTS_PAGE_SIZE } from '@/lib/constants'
import { EnvironmentLoader } from '@/components/dashboard/environment/environmentLoader'
import EmptyEnvironmentListContent from '@/components/dashboard/environment/emptyEnvironmentListContent'
import { cn } from '@/lib/utils'

function EnvironmentPage(): React.JSX.Element {
  const searchParams = useSearchParams()
  const highlightSlug = searchParams.get('highlight')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isHighlighted, setIsHighlighted] = useState(false)

  const isDeleteEnvironmentOpen = useAtomValue(deleteEnvironmentOpenAtom)
  const isEditEnvironmentOpen = useAtomValue(editEnvironmentOpenAtom)
  const [environments, setEnvironments] = useAtom(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const selectedEnvironment = useAtomValue(selectedEnvironmentAtom)

  const getAllEnvironmentsOfProject = useHttp(() =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: selectedProject!.slug,
        page,
        limit: ENVIRONMENTS_PAGE_SIZE
      }
    )
  )

  useEffect(() => {
    if (selectedProject) {
      setIsLoading(true)

      getAllEnvironmentsOfProject()
        .then(({ data, success }) => {
          if (success && data) {
            setEnvironments((prev) =>
              page === 0 ? data.items : [...prev, ...data.items]
            )
            if (data.metadata.links.next === null) {
              setHasMore(false)
            }
          }
        })
        .finally(() => setIsLoading(false))
    }
  }, [getAllEnvironmentsOfProject, page, selectedProject, setEnvironments])

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1)
  }

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

  if (isLoading && page === 0) {
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
          <div
            className={`grid h-fit w-full grid-cols-1 gap-8  p-3 text-white md:grid-cols-2 xl:grid-cols-3 ${isDeleteEnvironmentOpen ? 'inert' : ''} `}
          >
            {environments.map((environment) => (
              <EnvironmentCard
              className={cn(
                highlightSlug === environment.slug && isHighlighted && 'animate-highlight'
              )}
              environment={environment}
              key={environment.id}
              />
            ))}

            {/* Delete environment alert dialog */}
            {isDeleteEnvironmentOpen && selectedEnvironment ? (
              <ConfirmDeleteEnvironment />
            ) : null}

            {/* Edit environment dialog */}
            {isEditEnvironmentOpen && selectedEnvironment ? (
              <EditEnvironmentDialogue />
            ) : null}
          </div>
          {isLoading && page > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <EnvironmentLoader />
              <EnvironmentLoader />
              <EnvironmentLoader />
            </div>
          ) : null}
          <div className="text-center">
            <Button
              className="h-[2.25rem] rounded-md bg-white text-black hover:bg-gray-300"
              disabled={isLoading || !hasMore}
              onClick={handleLoadMore}
            >
              Load more
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnvironmentPage
