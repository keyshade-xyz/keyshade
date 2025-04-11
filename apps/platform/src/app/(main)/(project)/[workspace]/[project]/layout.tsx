'use client'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAtom, useSetAtom } from 'jotai'
import VariablePage from './@variable/page'
import SecretPage from './@secret/page'
import EnvironmentPage from './@environment/page'
import OverviewPage from './@overview/page'
import ControllerInstance from '@/lib/controller-instance'
import AddSecretDialog from '@/components/dashboard/secret/addSecretDialogue'
import { selectedProjectAtom, environmentsOfProjectAtom } from '@/store'
import AddVariableDialogue from '@/components/dashboard/variable/addVariableDialogue'
import AddEnvironmentDialogue from '@/components/dashboard/environment/addEnvironmentDialogue'
import { useHttp } from '@/hooks/use-http'

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

  const getProject = useHttp(() =>
    ControllerInstance.getInstance().projectController.getProject({
      projectSlug: params.project
    })
  )

  const getAllEnvironmentsOfProject = useHttp(() =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: selectedProject!.slug
      }
    )
  )

  useEffect(() => {
    getProject().then(({ data, success, error }) => {
      if (success && data) {
        setSelectedProject(data)
      } else {
        throw new Error(JSON.stringify(error))
      }
    })
  }, [getProject, params.project, setSelectedProject])

  useEffect(() => {
    selectedProject &&
      getAllEnvironmentsOfProject().then(({ data, success }) => {
        if (success && data) {
          setEnvironments(data.items)
        }
      })
  }, [getAllEnvironmentsOfProject, selectedProject, setEnvironments])

  return (
    <main className="flex h-full flex-col gap-4">
      {tab !== 'overview' && (
        <div className="flex h-[3.625rem] w-full justify-between p-3 ">
          <div className="text-3xl">{selectedProject?.name}</div>
          {tab === 'secret' && <AddSecretDialog />}
          {tab === 'variable' && <AddVariableDialogue />}
          {tab === 'environment' && <AddEnvironmentDialogue />}
        </div>
      )}

      <div className="h-full w-full overflow-y-scroll">
        {tab === 'overview' && <OverviewPage />}
        {tab === 'secret' && <SecretPage />}
        {tab === 'variable' && <VariablePage />}
        {tab === 'environment' && <EnvironmentPage />}
      </div>
    </main>
  )
}

export default DetailedProjectPage
