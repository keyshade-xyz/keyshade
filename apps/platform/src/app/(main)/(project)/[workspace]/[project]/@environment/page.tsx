'use client'
import { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { EnvironmentSVG } from '@public/svg/dashboard'
import {
  createEnvironmentOpenAtom,
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

function EnvironmentPage(): React.JSX.Element {
  const setIsCreateEnvironmentOpen = useSetAtom(createEnvironmentOpenAtom)
  const isDeleteEnvironmentOpen = useAtomValue(deleteEnvironmentOpenAtom)
  const isEditEnvironmentOpen = useAtomValue(editEnvironmentOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const selectedEnvironment = useAtomValue(selectedEnvironmentAtom)
  const [environments, setEnvironments] = useAtom(environmentsOfProjectAtom)

  // Pagination state: page number, loading, and whether more data is available
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const limit = 10 // default number of items per request

  // Prepare the API call using the useHttp hook with pagination parameters
  const getEnvironments = useHttp(() =>
    ControllerInstance.getInstance().environmentController.getEnvironmentsOfProject({
      projectSlug: selectedProject!.slug,
      page,
      limit,
      sort: 'name',
      order: 'asc',
      search: ''
    })
  )

  // Fetch environments when the component mounts or when the page changes
  useEffect(() => {
    if (selectedProject) {
      setLoading(true)
      getEnvironments()
        .then(({ data, success }) => {
          if (success && data) {
            // On first page, replace; on subsequent pages, append new items
            setEnvironments(prev =>
              page === 0 ? data.items : [...prev, ...data.items]
            )
            // If the returned items are fewer than the limit, there's no more data
            if (data.items.length < limit) {
              setHasMore(false)
            }
          }
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [selectedProject, page, getEnvironments, setEnvironments])

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      setPage(prevPage => prevPage + 1)
    }
  }

  return (
    <div className={`flex h-full w-full ${isDeleteEnvironmentOpen ? 'inert' : ''}`}>
      {environments.length === 0 && !loading ? (
        // Display when no environments are present
        <div className="flex h-[95%] w-full flex-col items-center justify-center gap-y-8">
          <EnvironmentSVG width={100} />

          <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4">
            <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
              Declare your first environment
            </p>
            <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500]">
              Declare and store a environment against different environments
            </p>
          </div>

          <Button
            className="h-[2.25rem] rounded-md bg-white text-black hover:bg-gray-300"
            onClick={() => setIsCreateEnvironmentOpen(true)}
          >
            Create environment
          </Button>
        </div>
      ) : (
        // Display environment cards along with the "Load More" button if more data exists
        <div
          className={`grid h-fit w-full grid-cols-1 gap-8 p-3 text-white md:grid-cols-2 xl:grid-cols-3 ${
            isDeleteEnvironmentOpen ? 'inert' : ''
          }`}
        >
          {environments.map(environment => (
            <EnvironmentCard environment={environment} key={environment.id} />
          ))}

          {hasMore ? <div className="col-span-full flex justify-center">
              <Button disabled={loading} onClick={handleLoadMore}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div> : null}

          {isDeleteEnvironmentOpen && selectedEnvironment ? <ConfirmDeleteEnvironment /> : null}
          {isEditEnvironmentOpen && selectedEnvironment ? <EditEnvironmentDialogue /> : null}
        </div>
      )}
    </div>
  )
}

export default EnvironmentPage
