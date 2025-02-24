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
  const [environments, setEnvironments] = useAtom(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const selectedEnvironment = useAtomValue(selectedEnvironmentAtom)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const getAllEnvironmentsOfProject = useHttp(() =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: selectedProject!.slug,
        page,
      }
    )
  )

  useEffect(() => {
  if(!selectedProject) return
   handleEnvironmentsFetch();
  }, [selectedProject, getAllEnvironmentsOfProject, setEnvironments])

  const handleEnvironmentsFetch = (newPage = 0) => {
    if (!selectedProject) return
    setIsLoading(true)
    getAllEnvironmentsOfProject()
      .then(({ data, success }) => {
        if (success && data) {
          const newData = newPage === 0 ? data.items : [...environments, ...data.items]
          if(newPage == 0 && page !== 0) setPage(0);
          setEnvironments(newData)
          if (newData.length >= data.metadata.totalCount) setHasMore(false)
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  const handlePageShift = () => {
    if (hasMore && !isLoading) {
      const finalPage = page + 1;
      setPage(finalPage)
      handleEnvironmentsFetch(finalPage)
    }
  }

  return (
    <div
      className={`flex h-full w-full ${isDeleteEnvironmentOpen ? 'inert' : ''} `}
    >
      {/* Showing this when there are no environments present */}
      {environments.length === 0 ? (
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
        //Showing this when environments are present
        <div className="flex w-full flex-col">
          <div
            className={`grid h-fit w-full grid-cols-1 gap-8  p-3 text-white md:grid-cols-2 xl:grid-cols-3 ${isDeleteEnvironmentOpen ? 'inert' : ''} `}
          >
            {environments.map((environment) => (
              <EnvironmentCard environment={environment} key={environment.id} />
            ))}

            {/* Delete environment alert dialog */}
            {isDeleteEnvironmentOpen && selectedEnvironment ? (
              <ConfirmDeleteEnvironment />
            ) : null}

            {/* Edit environment dialog */}
            {isEditEnvironmentOpen && selectedEnvironment ? (
              <EditEnvironmentDialogue />
            ) : null}

            {hasMore ? (
              <div className="col-span-full flex justify-center">
                <Button disabled={isLoading} onClick={handlePageShift}>
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnvironmentPage
