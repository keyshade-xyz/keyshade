/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ESLint incorrectly flags totalEventsCount comparison as always falsy */

import type { Project } from '@keyshade/schema'
import { useAtom, useAtomValue } from 'jotai'
import { useState, useEffect, useCallback } from 'react'
import type { VercelEnvironmentMapping } from '@keyshade/common'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom, integrationFormAtom } from '@/store'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import type {
  PartialEnvironment,
  PartialProject,
  VercelSystemEnvironment
} from '@/types'

interface CombinedProjectEnvironmentProps {
  isProjectDisabled?: boolean
  isKeyMappingNeeded: boolean
  projectPrivateKey?: string | null
  privateKeyLoading?: boolean
}

export default function ProjectEnvironmentSelect({
  isProjectDisabled = false,
  isKeyMappingNeeded = false,
  projectPrivateKey,
  privateKeyLoading
}: CombinedProjectEnvironmentProps): React.JSX.Element {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [formState, setFormState] = useAtom(integrationFormAtom)
  const [projects, setProjects] = useState<PartialProject[]>([])
  const [environments, setEnvironments] = useState<PartialEnvironment[]>([])

  const getAllProjectsOfWorkspace = useHttp(() =>
    ControllerInstance.getInstance().projectController.getAllProjects({
      workspaceSlug: currentWorkspace!.slug,
      limit: 100
    })
  )

  const getAllEnvironmentsOfProject = useHttp((projectSlug: Project['slug']) =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug,
        limit: 100
      }
    )
  )

  // Fetch all projects of the workspace
  useEffect(() => {
    if (!currentWorkspace || isProjectDisabled) return

    getAllProjectsOfWorkspace().then(({ data, success }) => {
      if (success && data) {
        setProjects(
          data.items.map(({ id, name, slug }) => ({ id, name, slug }))
        )
      }
    })
  }, [currentWorkspace, getAllProjectsOfWorkspace, isProjectDisabled])

  // Fetch environments when project changes
  useEffect(() => {
    if (!formState.selectedProjectSlug) {
      setEnvironments([])
      return
    }

    getAllEnvironmentsOfProject(formState.selectedProjectSlug).then(
      ({ data, success }) => {
        if (success && data) {
          setEnvironments(
            data.items.map(({ id, name, slug }) => ({ id, name, slug }))
          )
        }
      }
    )
  }, [formState.selectedProjectSlug, getAllEnvironmentsOfProject])

  const updateMappings = useCallback(
    (updater: (prev: VercelEnvironmentMapping) => VercelEnvironmentMapping) => {
      setFormState((prev) => ({
        ...prev,
        mappings: updater(prev.mappings)
      }))
    },
    [setFormState]
  )

  const handleProjectSelect = (projectValue: string) => {
    if (isProjectDisabled) return

    const project = JSON.parse(projectValue) as PartialProject
    setFormState((prev) => ({
      ...prev,
      selectedProjectSlug: project.slug,
      selectedEnvironments: [],
      mappings: {},
      manualPrivateKey: ''
    }))
  }

  const handleEnvironmentToggle = (environment: PartialEnvironment) => {
    setFormState((prev) => {
      const isSelected = prev.selectedEnvironments.includes(environment.slug)
      const newEnvironments = isSelected
        ? prev.selectedEnvironments.filter((slug) => slug !== environment.slug)
        : [...prev.selectedEnvironments, environment.slug]

      let newMappings = prev.mappings
      if (isKeyMappingNeeded) {
        if (isSelected) {
          const { [environment.slug]: _removed, ...rest } = prev.mappings
          newMappings = rest
        } else {
          newMappings = {
            ...prev.mappings,
            [environment.slug]: { vercelSystemEnvironment: 'development' }
          }
        }
      }

      return {
        ...prev,
        selectedEnvironments: newEnvironments,
        mappings: newMappings
      }
    })
  }

  const handleSingleEnvironmentSelect = useCallback(
    (environmentSlug: string) => {
      setFormState((prev) => ({
        ...prev,
        selectedEnvironments: [environmentSlug]
      }))
    },
    [setFormState]
  )

  const handleEnvironmentKeyDown = (
    event: React.KeyboardEvent,
    environment: PartialEnvironment
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleEnvironmentToggle(environment)
    }
  }

  const handleVercelEnvironmentChange = (
    envSlug: string,
    systemEnvironment: string
  ) => {
    updateMappings((prev) => ({
      ...prev,
      [envSlug]: {
        ...prev[envSlug],
        vercelSystemEnvironment:
          systemEnvironment === 'custom'
            ? undefined
            : (systemEnvironment as VercelSystemEnvironment),
        vercelCustomEnvironmentId:
          systemEnvironment === 'custom'
            ? prev[envSlug].vercelCustomEnvironmentId || ''
            : undefined
      }
    }))
  }

  const handleCustomIdChange = (envSlug: string, customId: string) => {
    updateMappings((prev) => ({
      ...prev,
      [envSlug]: {
        ...prev[envSlug],
        vercelCustomEnvironmentId: customId
      }
    }))
  }

  const handleManualPrivateKeyChange = (key: string) => {
    setFormState((prev) => ({
      ...prev,
      manualPrivateKey: key
    }))
  }

  const getVercelEnvironmentType = (envSlug: string) => {
    const mapping = formState.mappings[envSlug]
    if (!mapping) {
      return 'development'
    }
    return mapping.vercelCustomEnvironmentId !== undefined
      ? 'custom'
      : mapping.vercelSystemEnvironment || 'development'
  }

  const getCustomId = (envSlug: string) => {
    const mapping = formState.mappings[envSlug]
    return mapping.vercelCustomEnvironmentId || ''
  }

  const isEnvironmentSelected = (envSlug: string) =>
    formState.selectedEnvironments.includes(envSlug)

  const selectedProject = projects.find(
    (project) => project.slug === formState.selectedProjectSlug
  )

  const showPrivateKeyInput =
    formState.selectedProjectSlug && !privateKeyLoading && !projectPrivateKey

  return (
    <div className="flex flex-col gap-y-5">
      {/* Project Selection */}
      <div className="flex flex-col gap-y-2">
        <label className="font-medium text-white" htmlFor="project-select">
          Specify Project
        </label>
        <Select
          disabled={isProjectDisabled}
          onValueChange={handleProjectSelect}
          value={selectedProject ? JSON.stringify(selectedProject) : undefined}
        >
          <SelectTrigger
            className={`h-[2.25rem] w-[35rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5 ${
              isProjectDisabled ? 'cursor-not-allowed opacity-50' : ''
            }`}
            id="project-select"
          >
            <SelectValue placeholder="Select project">
              {selectedProject?.name || 'Select project'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white">
            {projects.length > 0 ? (
              projects.map((project) => (
                <SelectItem key={project.id} value={JSON.stringify(project)}>
                  {project.name}
                </SelectItem>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-yellow-600">
                No projects available in this workspace.
              </div>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Private Key Input - Always shown when project is selected but no private key is found */}
      {showPrivateKeyInput ? (
        <div className="flex flex-col gap-y-2">
          <label
            className="font-medium text-white"
            htmlFor="project-private-key"
          >
            Project Private Key
          </label>
          <Input
            className="h-[2.25rem] w-[35rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5"
            disabled={isProjectDisabled}
            id="project-private-key"
            onChange={(e) => handleManualPrivateKeyChange(e.target.value)}
            placeholder="Enter project private key"
            type="password"
            value={formState.manualPrivateKey}
          />
          <p className="text-sm text-white/60">
            This project doesn&apos;t have a stored private key. Please enter it
            manually.
          </p>
        </div>
      ) : null}

      {/* Environment Selection - Conditional based on isKeyMappingNeeded */}
      <div className="flex flex-col gap-y-2">
        <div className="font-medium text-white">
          {isKeyMappingNeeded
            ? 'Specify Environments & Map to Vercel Environments'
            : 'Specify Environment'}
        </div>

        {isKeyMappingNeeded ? (
          // Key Mapping Mode - Multiple environments with Vercel mapping
          <div className="rounded-md border border-white/10 p-2">
            {!formState.selectedProjectSlug ? (
              <div className="px-2 py-4 text-sm text-white/60">
                {isProjectDisabled
                  ? 'No project selected'
                  : 'Please select a project first'}
              </div>
            ) : environments.length > 0 ? (
              environments.map((env) => (
                <div
                  className="mb-3 rounded border border-white/10 bg-white/5 p-2"
                  key={env.id}
                >
                  <div
                    className="mb-2 flex cursor-pointer items-center gap-2"
                    onClick={() => handleEnvironmentToggle(env)}
                    onKeyDown={(event) => handleEnvironmentKeyDown(event, env)}
                    role="button"
                    tabIndex={0}
                  >
                    <input
                      checked={isEnvironmentSelected(env.slug)}
                      className="rounded border-white/20 bg-white/10 text-blue-500"
                      id={`env-checkbox-${env.id}`}
                      onChange={() => handleEnvironmentToggle(env)}
                      type="checkbox"
                    />
                    <label
                      className="cursor-pointer font-medium text-white"
                      htmlFor={`env-checkbox-${env.id}`}
                    >
                      {env.name}
                    </label>
                  </div>

                  {isEnvironmentSelected(env.slug) && (
                    <div className="ml-6 space-y-3">
                      <div>
                        <label
                          className="mb-1 block text-sm text-white/70"
                          htmlFor={`vercel-env-${env.id}`}
                        >
                          Vercel Environment Type:
                        </label>
                        <Select
                          onValueChange={(value) =>
                            handleVercelEnvironmentChange(env.slug, value)
                          }
                          value={getVercelEnvironmentType(env.slug)}
                        >
                          <SelectTrigger
                            className="h-8 border-white/20 bg-white/10 text-sm text-white"
                            id={`vercel-env-${env.id}`}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white">
                            <SelectItem value="development">
                              Development
                            </SelectItem>
                            <SelectItem value="preview">Preview</SelectItem>
                            <SelectItem value="production">
                              Production
                            </SelectItem>
                            <SelectItem value="custom">
                              Custom Environment
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {getVercelEnvironmentType(env.slug) === 'custom' && (
                        <div>
                          <label
                            className="mb-1 block text-sm text-white/70"
                            htmlFor={`custom-env-id-${env.id}`}
                          >
                            Custom Environment ID:
                          </label>
                          <Input
                            className="h-8 border-white/20 bg-white/10 text-sm text-white placeholder-white/50"
                            id={`custom-env-id-${env.id}`}
                            onChange={(e) =>
                              handleCustomIdChange(env.slug, e.target.value)
                            }
                            placeholder="Enter custom environment ID"
                            type="text"
                            value={getCustomId(env.slug)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-2 py-4 text-sm text-yellow-600">
                No environments available for this project.
              </div>
            )}
          </div>
        ) : (
          <Select
            disabled={!formState.selectedProjectSlug}
            onValueChange={handleSingleEnvironmentSelect}
            value={formState.selectedEnvironments[0] || ''}
          >
            <SelectTrigger
              className={`h-[2.25rem] w-[35rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5 ${
                !formState.selectedProjectSlug
                  ? 'cursor-not-allowed opacity-50'
                  : ''
              }`}
              id="environment-select"
            >
              <SelectValue placeholder="Select environment">
                {environments.find(
                  (env) => env.slug === formState.selectedEnvironments[0]
                )?.name || 'Select environment'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="border-[0.013rem] border-white/10 bg-neutral-800 text-white">
              {!formState.selectedProjectSlug ? (
                <div className="px-4 py-2 text-sm text-white/60">
                  Please select a project first
                </div>
              ) : environments.length > 0 ? (
                environments.map((env) => (
                  <SelectItem key={env.id} value={env.slug}>
                    {env.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-4 py-2 text-sm text-yellow-600">
                  No environments available for this project.
                </div>
              )}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  )
}
