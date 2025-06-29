import type {
  Environment,
  Project,
  ProjectWithTierLimitAndCount
} from '@keyshade/schema'
import { useAtomValue } from 'jotai'
import { useState, useEffect, useCallback } from 'react'
import type { VercelEnvironmentMapping } from '@keyshade/common'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { selectedWorkspaceAtom } from '@/store'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'

type PartialProject = Pick<Project, 'id' | 'name' | 'slug'>
type PartialEnvironment = Pick<Environment, 'id' | 'name' | 'slug'>
type VercelSystemEnvironment = 'development' | 'preview' | 'production'
type PartialProjectWithKey = Pick<
  ProjectWithTierLimitAndCount,
  'slug' | 'storePrivateKey' | 'privateKey'
>

interface ProjectEnvironmentMappingProps {
  onProjectChange?: (projectSlug: Project['slug'] | null) => void
  onEnvironmentChange?: (environmentSlugs: Environment['slug'][]) => void
  onKeyMappingChange?: (mappings: VercelEnvironmentMapping) => void
  initialProject?: PartialProject | null
  initialEnvironments?: PartialEnvironment[] | null
  keyMapping?: VercelEnvironmentMapping | null
  selectedProject?: PartialProjectWithKey | null
  projectPrivateKey?: string | null
  privateKeyLoading?: boolean
  manualPrivateKey?: string
  onManualPrivateKeyChange?: (key: string) => void
}

export default function ProjectEnvironmentMapping({
  onProjectChange,
  onEnvironmentChange,
  onKeyMappingChange,
  initialProject,
  initialEnvironments,
  keyMapping,
  selectedProject,
  projectPrivateKey,
  privateKeyLoading,
  manualPrivateKey,
  onManualPrivateKeyChange
}: ProjectEnvironmentMappingProps): React.JSX.Element {
  const currentWorkspace = useAtomValue(selectedWorkspaceAtom)
  const [projects, setProjects] = useState<PartialProject[]>([])
  const [environments, setEnvironments] = useState<PartialEnvironment[]>([])
  const [selectedProjectLocal, setSelectedProjectLocal] =
    useState<PartialProject | null>(initialProject || null)
  const [selectedEnvironments, setSelectedEnvironments] = useState<
    PartialEnvironment[]
  >(initialEnvironments || [])
  const [environmentMappings, setEnvironmentMappings] =
    useState<VercelEnvironmentMapping>(keyMapping || {})

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

  useEffect(() => {
    if (!currentWorkspace) return

    getAllProjectsOfWorkspace().then(({ data, success }) => {
      if (success && data) {
        setProjects(
          data.items.map(({ id, name, slug }) => ({ id, name, slug }))
        )
      }
    })
  }, [currentWorkspace, getAllProjectsOfWorkspace])

  // Fetch environments on project change
  useEffect(() => {
    if (!selectedProjectLocal) {
      setEnvironments([])
      return
    }

    getAllEnvironmentsOfProject(selectedProjectLocal.slug).then(
      ({ data, success }) => {
        if (success && data) {
          setEnvironments(
            data.items.map(({ id, name, slug }) => ({ id, name, slug }))
          )
        }
      }
    )
  }, [selectedProjectLocal, getAllEnvironmentsOfProject])

  // Sync initial environments with fetched environments
  useEffect(() => {
    if (initialEnvironments && environments.length > 0) {
      const syncedEnvironments = environments.filter((env) =>
        initialEnvironments.some((initial) => initial.id === env.id)
      )
      setSelectedEnvironments(syncedEnvironments)
    }
  }, [environments, initialEnvironments])

  const updateMappings = useCallback(
    (updater: (prev: VercelEnvironmentMapping) => VercelEnvironmentMapping) => {
      setEnvironmentMappings((prev) => {
        const updated = updater(prev)
        onKeyMappingChange?.(updated)
        return updated
      })
    },
    [onKeyMappingChange]
  )

  const handleProjectSelect = (projectValue: string) => {
    const project = JSON.parse(projectValue) as PartialProject
    setSelectedProjectLocal(project)
    setSelectedEnvironments([])
    setEnvironmentMappings({})

    onProjectChange?.(project.slug)
    onEnvironmentChange?.([])
    onKeyMappingChange?.({})
  }

  const handleEnvironmentToggle = (environment: PartialEnvironment) => {
    setSelectedEnvironments((prev) => {
      const isSelected = prev.some((env) => env.id === environment.id)
      const newSelection = isSelected
        ? prev.filter((env) => env.id !== environment.id)
        : [...prev, environment]

      onEnvironmentChange?.(newSelection.map((env) => env.slug))

      updateMappings((prevMappings) => {
        const updated = { ...prevMappings }
        if (isSelected) {
          const { [environment.name]: _removed, ...rest } = updated
          return rest
        }
        updated[environment.name] = { vercelSystemEnvironment: 'development' }
        return updated
      })

      return newSelection
    })
  }

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
    envName: string,
    systemEnvironment: string
  ) => {
    updateMappings((prev) => ({
      ...prev,
      [envName]: {
        ...prev[envName],
        vercelSystemEnvironment:
          systemEnvironment === 'custom'
            ? undefined
            : (systemEnvironment as VercelSystemEnvironment),
        vercelCustomEnvironmentId:
          systemEnvironment === 'custom'
            ? prev[envName].vercelCustomEnvironmentId || ''
            : undefined
      }
    }))
  }

  const handleCustomIdChange = (envName: string, customId: string) => {
    updateMappings((prev) => ({
      ...prev,
      [envName]: {
        ...prev[envName],
        vercelCustomEnvironmentId: customId
      }
    }))
  }

  const getVercelEnvironmentType = (envName: string) => {
    const mapping = environmentMappings[envName]
    return mapping.vercelCustomEnvironmentId !== undefined
      ? 'custom'
      : mapping.vercelSystemEnvironment || 'development'
  }

  const getCustomId = (envName: string) =>
    environmentMappings[envName].vercelCustomEnvironmentId || ''

  const isEnvironmentSelected = (envId: string) =>
    selectedEnvironments.some((env) => env.id === envId)

  // Check if private key input should be shown
  const showPrivateKeyInput =
    selectedProject && !privateKeyLoading && !projectPrivateKey

  return (
    <div className="flex flex-col gap-y-5">
      <div className="flex flex-col gap-y-2">
        <label className="font-medium text-white" htmlFor="project-select">
          Specify Project
        </label>
        <Select
          onValueChange={handleProjectSelect}
          value={
            selectedProjectLocal
              ? JSON.stringify(selectedProjectLocal)
              : undefined
          }
        >
          <SelectTrigger
            className="h-[2.25rem] w-[35rem] rounded-[0.375rem] border-[0.013rem] border-white/10 bg-white/5"
            id="project-select"
          >
            <SelectValue placeholder="Select project">
              {selectedProjectLocal?.name || 'Select project'}
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

      {/* Private Key Input - Show when project is selected but no private key is found */}
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
            id="project-private-key"
            onChange={(e) => onManualPrivateKeyChange?.(e.target.value)}
            placeholder="Enter project private key"
            type="password"
            value={manualPrivateKey || ''}
          />
          <p className="text-sm text-white/60">
            This project doesn&apos;t have a stored private key. Please enter it
            manually.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-y-2">
        <div className="font-medium text-white">
          Specify Environments & Map to Vercel Environments
        </div>
        <div className="rounded-md border border-white/10 p-2">
          {!selectedProjectLocal ? (
            <div className="px-2 py-4 text-sm text-white/60">
              Please select a project first
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
                    checked={isEnvironmentSelected(env.id)}
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

                {isEnvironmentSelected(env.id) && (
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
                          handleVercelEnvironmentChange(env.name, value)
                        }
                        value={getVercelEnvironmentType(env.name)}
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
                          <SelectItem value="production">Production</SelectItem>
                          <SelectItem value="custom">
                            Custom Environment
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {getVercelEnvironmentType(env.name) === 'custom' && (
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
                            handleCustomIdChange(env.name, e.target.value)
                          }
                          placeholder="Enter custom environment ID"
                          type="text"
                          value={getCustomId(env.name)}
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
      </div>
    </div>
  )
}
