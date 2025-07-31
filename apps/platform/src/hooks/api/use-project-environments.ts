import { useEffect } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import type {
  GetAllEnvironmentsOfProjectResponse,
  GetAllProjectsResponse
} from '@keyshade/schema'
import { environmentsOfProjectAtom, selectedProjectAtom } from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'

interface UseProjectEnvironmentsReturn {
  /**
   * List of environments associated with the selected project.
   */
  environmentsOfProject: GetAllEnvironmentsOfProjectResponse['items']
  /**
   * Currently selected project.
   */
  selectedProject: GetAllProjectsResponse['items'][number] | null
}

/**
 * fetch and manage the environments associated with the currently selected project.
 */
export const useProjectEnvironments = (): UseProjectEnvironmentsReturn => {
  const selectedProject = useAtomValue(selectedProjectAtom)
  const [environmentsOfProject, setEnvironmentsOfProject] = useAtom(
    environmentsOfProjectAtom
  )

  const fetchEnvironments = useHttp(() =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: selectedProject?.slug ?? ''
      }
    )
  )

  useEffect(() => {
    if (!selectedProject) return

    fetchEnvironments().then(({ data, success }) => {
      if (success && data) {
        setEnvironmentsOfProject(data.items)
      }
    })
  }, [selectedProject, fetchEnvironments, setEnvironmentsOfProject])

  return {
    environmentsOfProject,
    selectedProject
  }
}
