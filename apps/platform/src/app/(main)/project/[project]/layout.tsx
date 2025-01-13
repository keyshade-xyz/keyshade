'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type {
  ClientResponse,
  GetAllEnvironmentsOfProjectResponse
} from '@keyshade/schema'
import { toast } from 'sonner'
import { useAtom, useSetAtom } from 'jotai'
import VariablePage from './@variable/page'
import SecretPage from './@secret/page'
import ControllerInstance from '@/lib/controller-instance'
import AddSecretDialog from '@/components/dashboard/secret/addSecretDialogue'
import { Toaster } from '@/components/ui/sonner'
import { selectedProjectAtom, environmentsOfProjectAtom } from '@/store'
import AddVariableDialogue from '@/components/dashboard/variable/addVariableDialogue'

interface DetailedProjectPageProps {
  params: { project: string }
  secret: React.ReactNode
  variable: React.ReactNode
}

function DetailedProjectPage({
  params
}: DetailedProjectPageProps): JSX.Element {
  const [selectedProject, setselectedProject] = useAtom(selectedProjectAtom)
  const setEnvironments = useSetAtom(environmentsOfProjectAtom)

  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'

  useEffect(() => {
    async function getProjectBySlug() {
      const { success, error, data } =
        await ControllerInstance.getInstance().projectController.getProject(
          { projectSlug: params.project },
          {}
        )

      if (success && data) {
        setselectedProject(data)
      } else {
        toast.error('Something went wrong!', {
          description: (
            <p className="text-xs text-red-300">
              Something went wrong while fetching the project. Check console for
              more info.
            </p>
          )
        })
        // eslint-disable-next-line no-console -- we need to log the error
        console.error(error)
      }
    }

    getProjectBySlug()
  }, [params.project, setselectedProject])

  useEffect(() => {
    const getAllEnvironments = async () => {
      if (!selectedProject) {
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
    <main className="flex flex-col gap-4">
      <div className="flex h-[3.625rem] w-full justify-between p-3 ">
        <div className="text-3xl">{selectedProject?.name}</div>
        {tab === 'secret' && <AddSecretDialog />}
        {tab === 'variable' && <AddVariableDialogue />}
      </div>

      <div className="h-full w-full overflow-y-scroll">
        {tab === 'secret' && <SecretPage />}
        {tab === 'variable' && <VariablePage />}
      </div>
      <Toaster />
    </main>
  )
}

export default DetailedProjectPage
