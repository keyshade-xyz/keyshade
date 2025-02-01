'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { useAtom, useSetAtom } from 'jotai'
import VariablePage from './@variable/page'
import SecretPage from './@secret/page'
import EnvironmentPage from './@environment/page'
import ControllerInstance from '@/lib/controller-instance'
import AddSecretDialog from '@/components/dashboard/secret/addSecretDialogue'
import { Toaster } from '@/components/ui/sonner'
import { selectedProjectAtom, environmentsOfProjectAtom } from '@/store'
import AddVariableDialogue from '@/components/dashboard/variable/addVariableDialogue'
import AddEnvironmentDialogue from '@/components/dashboard/environment/addEnvironmentDialogue'

interface DetailedProjectPageProps {
  params: { project: string }
}

function DetailedProjectPage({
  params
}: DetailedProjectPageProps): JSX.Element {
  const [selectedProject, setSelectedProject] = useAtom(selectedProjectAtom)
  const setEnvironments = useSetAtom(environmentsOfProjectAtom)

  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'

  useEffect(() => {
    ControllerInstance.getInstance()
      .projectController.getProject({ projectSlug: params.project }, {})
      .then(({ data, success, error }) => {
        if (success && data) {
          setSelectedProject(data)
        } else {
          throw new Error(JSON.stringify(error))
        }
      })
      .catch((error) => {
        throw new Error(JSON.stringify(error))
      })
  }, [params.project, setSelectedProject])

  useEffect(() => {
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

    ControllerInstance.getInstance()
      .environmentController.getAllEnvironmentsOfProject(
        { projectSlug: selectedProject.slug },
        {}
      )
      .then(({ data, success, error }) => {
        if (success && data) {
          setEnvironments(data.items)
        } else {
          throw new Error(JSON.stringify(error))
        }
      })
      .catch((error) => {
        throw new Error(JSON.stringify(error))
      })
  }, [selectedProject, setEnvironments])

  return (
    <main className="flex h-full flex-col gap-4">
      <div className="flex h-[3.625rem] w-full justify-between p-3 ">
        <div className="text-3xl">{selectedProject?.name}</div>
        {tab === 'secret' && <AddSecretDialog />}
        {tab === 'variable' && <AddVariableDialogue />}
        {tab === 'environment' && <AddEnvironmentDialogue />}
      </div>

      <div className="h-full w-full overflow-y-scroll">
        {tab === 'secret' && <SecretPage />}
        {tab === 'variable' && <VariablePage />}
        {tab === 'environment' && <EnvironmentPage />}
      </div>
      <Toaster />
    </main>
  )
}

export default DetailedProjectPage
