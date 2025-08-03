/* eslint-disable @typescript-eslint/no-unnecessary-condition -- ESLint incorrectly flags totalEventsCount comparison as always truthy */

import { useState, useEffect, useCallback } from 'react'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select'
import type { PartialEnvironment, PartialProject } from '@/types'

export type VercelEnvironmentMapping = Record<
  string,
  {
    vercelSystemEnvironment?: 'production' | 'preview' | 'development'
    vercelCustomEnvironmentId?: string
  }
>
interface UpdateKeyMappingProps {
  initialProject: PartialProject
  initialEnvironments: PartialEnvironment[]
  initialMapping: VercelEnvironmentMapping
  onEnvSlugsChange: (envSlugs: string[]) => void
  onMappingChange: (mapping: VercelEnvironmentMapping) => void
  disabled?: boolean
}

export default function UpdateKeyMapping({
  initialProject,
  initialEnvironments,
  initialMapping,
  onEnvSlugsChange,
  onMappingChange,
  disabled = false
}: UpdateKeyMappingProps): React.JSX.Element {
  const [environments, setEnvironments] = useState<PartialEnvironment[]>([])
  const [envSlugs, setEnvSlugs] = useState<string[]>(
    initialEnvironments.map((env) => env.slug)
  )
  const [mappings, setMappings] =
    useState<VercelEnvironmentMapping>(initialMapping)

  const fetchEnvironments = useHttp((projectSlug: string) =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      { projectSlug, limit: 100 }
    )
  )

  useEffect(() => {
    setEnvSlugs(initialEnvironments.map((env) => env.slug))
  }, [initialEnvironments])

  useEffect(() => {
    setMappings(initialMapping)
    onMappingChange(initialMapping)
  }, [initialMapping, onMappingChange])

  // Fetch environments for the project
  useEffect(() => {
    fetchEnvironments(initialProject.slug).then(({ data, success }) => {
      if (success && data?.items) {
        setEnvironments(
          data.items.map((env) => ({
            id: env.id,
            name: env.name,
            slug: env.slug
          }))
        )
      }
    })
  }, [initialProject.slug, fetchEnvironments])

  const updateEnvSlugs = useCallback(
    (slug: string, selected: boolean) => {
      setEnvSlugs((prev) => {
        const next = selected ? [...prev, slug] : prev.filter((s) => s !== slug)
        onEnvSlugsChange(next)
        return next
      })
    },
    [onEnvSlugsChange]
  )

  const updateMappings = useCallback(
    (updater: (prev: VercelEnvironmentMapping) => VercelEnvironmentMapping) => {
      setMappings((prev) => {
        const next = updater(prev)
        onMappingChange(next)
        return next
      })
    },
    [onMappingChange]
  )

  const toggleEnvironment = (slug: string) => {
    const isSelected = envSlugs.includes(slug)
    updateEnvSlugs(slug, !isSelected)
    updateMappings((prev) => {
      if (prev[slug]) {
        const { [slug]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [slug]: { vercelSystemEnvironment: 'development' } }
    })
  }

  const changeSystemEnv = (slug: string, value: string) => {
    const isCustom = value === 'custom'
    updateMappings((prev) => ({
      ...prev,
      [slug]: {
        ...prev[slug],
        vercelSystemEnvironment: isCustom
          ? undefined
          : (value as 'production' | 'preview' | 'development'),
        vercelCustomEnvironmentId: isCustom
          ? prev[slug].vercelCustomEnvironmentId || ''
          : undefined
      }
    }))
  }

  const changeCustomId = (slug: string, id: string) => {
    updateMappings((prev) => ({
      ...prev,
      [slug]: { ...prev[slug], vercelCustomEnvironmentId: id }
    }))
  }

  const getType = (slug: string) => {
    const m = mappings[slug]
    return m?.vercelCustomEnvironmentId !== undefined
      ? 'custom'
      : m?.vercelSystemEnvironment || 'development'
  }

  const getCustom = (slug: string) =>
    mappings[slug]?.vercelCustomEnvironmentId || ''

  return (
    <div className="flex flex-col gap-y-5">
      <div className="flex flex-col gap-y-2">
        <p className="font-medium text-white">Project</p>
        <Select disabled value={initialProject.slug}>
          <SelectTrigger className="h-[2.25rem] rounded border bg-white/5 opacity-50">
            <SelectValue>{initialProject.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={initialProject.slug}>
              {initialProject.name}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-y-2">
        <label className="font-medium text-white" htmlFor="env-container">
          Select Environment
        </label>
        <div
          className="rounded-md border border-white/10 p-2"
          id="env-container"
        >
          {environments.length === 0 ? (
            <div className="px-2 py-4 text-sm text-yellow-600">
              No environments available
            </div>
          ) : (
            environments.map((env) => {
              const selected = envSlugs.includes(env.slug)
              return (
                <div
                  className="mb-3 flex flex-col gap-1 rounded border border-white/10 bg-white/5 p-2"
                  key={env.id}
                >
                  <div className="flex items-center gap-2">
                    <input
                      checked={selected}
                      className="rounded border-white/20 bg-white/10"
                      disabled={disabled}
                      id={`env-${env.id}`}
                      onChange={() => toggleEnvironment(env.slug)}
                      type="checkbox"
                    />
                    <label
                      className="font-medium text-white"
                      htmlFor={`env-${env.id}`}
                    >
                      {env.name}
                    </label>
                  </div>

                  {selected ? (
                    <div className="ml-6 mt-2 space-y-3">
                      <div className="flex flex-col items-start gap-2">
                        <label
                          className="block text-sm text-white/70"
                          htmlFor={`type-${env.id}`}
                        >
                          Vercel Environment Type:
                        </label>
                        <Select
                          disabled={disabled}
                          onValueChange={(v) => changeSystemEnv(env.slug, v)}
                          value={getType(env.slug)}
                        >
                          <SelectTrigger className="h-8 border-white/20 bg-white/10 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="border-white/10 bg-neutral-800 text-white">
                            <SelectItem value="development">
                              Development
                            </SelectItem>
                            <SelectItem value="preview">Preview</SelectItem>
                            <SelectItem value="production">
                              Production
                            </SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {getType(env.slug) === 'custom' && (
                        <div className="flex flex-col items-start gap-2">
                          <label
                            className="block text-sm text-white/70"
                            htmlFor={`custom-${env.id}`}
                          >
                            Custom Environment ID:
                          </label>
                          <input
                            className="h-8 w-full rounded-md border border-white/20 bg-white/10 p-2 text-sm placeholder-white/50"
                            disabled={disabled}
                            id={`custom-${env.id}`}
                            onChange={(e) =>
                              changeCustomId(env.slug, e.target.value)
                            }
                            placeholder="Enter custom ID"
                            type="text"
                            value={getCustom(env.slug)}
                          />
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
