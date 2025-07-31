'use client'
import { useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import VariablePage from './@variable/page'
import SecretPage from './@secret/page'
import EnvironmentPage from './@environment/page'
import OverviewPage from './@overview/page'
import ControllerInstance from '@/lib/controller-instance'
import AddSecretDialog from '@/components/dashboard/secret/addSecretDialogue'
import {
  selectedProjectAtom,
  environmentsOfProjectAtom,
  globalSearchDataAtom,
  projectEnvironmentCountAtom,
  projectSecretCountAtom,
  projectVariableCountAtom,
  selectedWorkspaceAtom
} from '@/store'
import AddVariableDialogue from '@/components/dashboard/variable/addVariableDialogue'
import AddEnvironmentDialogue from '@/components/dashboard/environment/addEnvironmentDialogue'
import { useHttp } from '@/hooks/use-http'

function DetailedProjectPage(): JSX.Element {
  const { project: projectSlug }: { project: string } = useParams()
  const [selectedProject, setSelectedProject] = useAtom(selectedProjectAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const setEnvironmentCount = useSetAtom(projectEnvironmentCountAtom)
  const setSecretCount = useSetAtom(projectSecretCountAtom)
  const setVariableCount = useSetAtom(projectVariableCountAtom)
  const setEnvironments = useSetAtom(environmentsOfProjectAtom)
  const setGlobalSearchData = useSetAtom(globalSearchDataAtom)

  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') ?? 'rollup-details'

  const isAuthorizedToViewProject =
    selectedWorkspace?.entitlements.canReadProjects
  const isAuthorizedToViewEnvironments =
    selectedProject?.entitlements.canReadEnvironments

  const getProject = useHttp(() =>
    ControllerInstance.getInstance().projectController.getProject({
      projectSlug
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
    if (!projectSlug) return
    if (!isAuthorizedToViewProject) return

    getProject().then(({ data, success, error }) => {
      if (success && data) {
        setSelectedProject(data)
        setEnvironmentCount(data.totalEnvironments)
        setSecretCount(data.totalSecrets)
        setVariableCount(data.totalVariables)
      } else {
        throw new Error(JSON.stringify(error))
      }
    })
  }, [
    getProject,
    projectSlug,
    setSelectedProject,
    setEnvironmentCount,
    setSecretCount,
    setVariableCount,
    isAuthorizedToViewProject
  ])

  useEffect(() => {
    isAuthorizedToViewEnvironments &&
      getAllEnvironmentsOfProject().then(({ data, success }) => {
        if (success && data) {
          setEnvironments(data.items)
          setGlobalSearchData((prev) => ({
            ...prev,
            environments: data.items.map((env) => ({
              name: env.name,
              slug: env.slug,
              description: env.description
            }))
          }))
        }
      })
  }, [
    getAllEnvironmentsOfProject,
    selectedProject,
    setEnvironments,
    setGlobalSearchData,
    isAuthorizedToViewEnvironments
  ])

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
