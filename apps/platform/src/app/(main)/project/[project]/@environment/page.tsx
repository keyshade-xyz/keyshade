'use client'

import { useEffect } from 'react'
import type {
  ClientResponse,
  GetAllEnvironmentsOfProjectResponse
} from '@keyshade/schema'
import { EnvironmentSVG } from '@public/svg/dashboard'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { toast } from 'sonner'
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

function EnvironmentPage(): React.JSX.Element {
  const setIsCreateEnvironmentOpen = useSetAtom(createEnvironmentOpenAtom)
  const isDeleteEnvironmentOpen = useAtomValue(deleteEnvironmentOpenAtom)
  const isEditEnvironmentOpen = useAtomValue(editEnvironmentOpenAtom)
  const [environments, setEnvironments] = useAtom(environmentsOfProjectAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const selectedEnvironment = useAtomValue(selectedEnvironmentAtom)

  useEffect(() => {
    const getAllEnvironments = async () => {
      if (!selectedProject) {
        toast.error('No project selected', {
          description: (
            <p className="text-xs text-red-300">
              No project selected. Please select a project.
            </p>
          )
        })
        return
      }

      const {
        success,
        error,
        data
      }: ClientResponse<GetAllEnvironmentsOfProjectResponse> =
        await ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
          { projectSlug: selectedProject.slug },
          {}
        )

      if (success && data) {
        setEnvironments(data.items)
      } else {
        toast.error('Something went wrong!', {
          description: (
            <p className="text-xs text-red-300">
              Something went wrong while fetching environments. Check console
              for more info.
            </p>
          )
        })
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    }

    getAllEnvironments()
  }, [selectedProject, setEnvironments])

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
        // Showing this when environments are present
        <div
          className={`grid h-fit w-full grid-cols-1 gap-8  p-3 text-white md:grid-cols-2 ${isDeleteEnvironmentOpen ? 'inert' : ''} `}
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
        </div>
      )}
    </div>
  )
}

export default EnvironmentPage
