import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { useEffect, useMemo, useState } from 'react'
import type { GetAllProjectsResponse } from '@keyshade/schema'
import { useHttp } from '../use-http'
import {
  globalSearchDataAtom,
  projectsOfWorkspaceAtom,
  selectedWorkspaceAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'

interface UseGetAllProjectsReturn {
  /**
   * Indicates if the projects are currently being loaded.
   */
  loading: boolean
  /**
   * The list of projects fetched from the API.
   */
  projects: GetAllProjectsResponse['items']
  /**
   * Indicates if there are no projects available.
   */
  isProjectsEmpty: boolean
  /**
   * Function to fetch projects with pagination support.
   * @param params - An object containing `page` and `limit` for pagination.
   * @returns A promise that resolves to an object containing success status, error message (if any), and the fetched data.
   */
  fetchProjects: (params: { page: number; limit: number }) => Promise<{
    success: boolean
    error?: { message: string }
    data:
      | GetAllProjectsResponse
      | { items: never[]; metadata: { totalCount: number } }
  }>
}
/**
 * Fetches all projects for the selected workspace.
 */
export function useGetAllProjects(): UseGetAllProjectsReturn {
  const [loading, setLoading] = useState<boolean>(true)
  const setGlobalSearchData = useSetAtom(globalSearchDataAtom)
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [projects, setProjects] = useAtom(projectsOfWorkspaceAtom)

  const isProjectsEmpty = useMemo(() => projects.length === 0, [projects])
  const isAuthorizedToViewProject =
    selectedWorkspace?.entitlements.canReadProjects

  const getAllProjects = useHttp(() =>
    ControllerInstance.getInstance().projectController.getAllProjects({
      workspaceSlug: selectedWorkspace!.slug
    })
  )

  const fetchProjects = async ({
    page,
    limit
  }: {
    page: number
    limit: number
  }) => {
    const response =
      await ControllerInstance.getInstance().projectController.getAllProjects({
        workspaceSlug: selectedWorkspace!.slug,
        page,
        limit
      })

    const items = response.data?.items ?? []
    const totalCount = response.data?.metadata.totalCount ?? 0

    return {
      success: response.success,
      error: response.error ? { message: response.error.message } : undefined,
      data: {
        items,
        metadata: { totalCount }
      }
    }
  }

  useEffect(() => {
    if (isAuthorizedToViewProject) {
      getAllProjects()
        .then(({ data, success }) => {
          if (success && data) {
            setProjects(data.items)
            setGlobalSearchData((prev) => ({
              ...prev,
              projects: data.items.map((project) => ({
                name: project.name,
                slug: project.slug,
                description: project.description
              }))
            }))
          }
        })
        .finally(() => setLoading(false))
    } else {
      setProjects([])
      setLoading(false)
    }
  }, [
    selectedWorkspace,
    getAllProjects,
    setGlobalSearchData,
    setProjects,
    isAuthorizedToViewProject
  ])

  return {
    loading,
    projects,
    isProjectsEmpty,
    fetchProjects
  }
}
