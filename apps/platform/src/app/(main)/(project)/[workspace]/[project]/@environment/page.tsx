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

const INITIAL_DISPLAY_COUNT = 10

function EnvironmentPage(): React.JSX.Element {
  const setIsCreateEnvironmentOpen = useSetAtom(createEnvironmentOpenAtom)
  const isDeleteEnvironmentOpen = useAtomValue(deleteEnvironmentOpenAtom)
  const isEditEnvironmentOpen = useAtomValue(editEnvironmentOpenAtom)
  const [environments, setEnvironments] = useAtom(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const selectedEnvironment = useAtomValue(selectedEnvironmentAtom)
  const [visibleCount, setVisibleCount] = useState<number>(INITIAL_DISPLAY_COUNT)

  const getAllEnvironmentsOfProject = useHttp(() =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: selectedProject!.slug
      }
    )
  )

  useEffect(() => {
    selectedProject &&
      getAllEnvironmentsOfProject().then(({ data, success }) => {
        if (success && data) {
          setEnvironments(data.items)
        }
      })
  }, [getAllEnvironmentsOfProject, selectedProject, setEnvironments])

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
            {environments?.slice(0, visibleCount)?.map((environment) => (
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
          </div>
          {visibleCount < environments.length && (
            <div className="my-2 flex w-full justify-center py-2">
              <Button onClick={()=> setVisibleCount((prev) => prev + INITIAL_DISPLAY_COUNT)}>Load More</Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default EnvironmentPage
