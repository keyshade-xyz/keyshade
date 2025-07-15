import { useState, useCallback } from 'react'
import { useAtom } from 'jotai'
import { toast } from 'sonner'
import type { ExportProjectRequest } from '@keyshade/schema'
import { selectedProjectAtom } from '@/store'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'

export interface ExportFormData extends Omit<ExportProjectRequest, 'projectSlug'> {
  privateKey: string
}

export const useExportProjectForm = () => {
  const [selectedProject] = useAtom(selectedProjectAtom)
  const { projectPrivateKey: browserProjectPrivateKey } = useProjectPrivateKey(selectedProject)
  
  const [formData, setFormData] = useState<ExportFormData>({
    environmentSlugs: [],
    format: '',
    privateKey: ''
  })

  const resetForm = useCallback(() => {
    setFormData({
      environmentSlugs: [],
      format: '',
      privateKey: ''
    })
  }, [])

  const handleEnvironmentToggle = useCallback((slug: string, checked: boolean) => {
    setFormData((prev) => {
      const set = new Set(prev.environmentSlugs)
      if (checked) {
        set.add(slug)
      } else {
        set.delete(slug)
      }
      return { ...prev, environmentSlugs: Array.from(set) }
    })
  }, [])

  const updateFormData = useCallback((updates: Partial<ExportFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const validateForm = useCallback((): boolean => {
    const NO_PROJECT_SELECTED = !selectedProject
    const HAS_NO_PRIVATE_KEY =
      !selectedProject?.storePrivateKey &&
      !formData.privateKey &&
      !browserProjectPrivateKey
    const HAS_NO_ENVIRONMENTS = formData.environmentSlugs.length < 1
    const FORMAT_NOT_SELECTED = !formData.format

    const validations = [
      { condition: NO_PROJECT_SELECTED, message: 'No project selected' },
      {
        condition: HAS_NO_ENVIRONMENTS,
        message: 'Please select at least one environment'
      },
      { condition: FORMAT_NOT_SELECTED, message: 'Please pick a format' },
      {
        condition: HAS_NO_PRIVATE_KEY,
        message: 'Private Key is required for this project'
      }
    ]

    for (const { condition, message } of validations) {
      if (condition) {
        toast.error(message)
        return false
      }
    }

    return true
  }, [selectedProject, formData, browserProjectPrivateKey])

  return {
    formData,
    resetForm,
    handleEnvironmentToggle,
    updateFormData,
    validateForm,
    selectedProject,
    browserProjectPrivateKey
  }
}