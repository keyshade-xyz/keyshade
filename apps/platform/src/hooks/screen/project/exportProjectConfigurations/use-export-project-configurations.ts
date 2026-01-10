import { useState, useCallback } from 'react'
import { useSetAtom } from 'jotai'
import { toast } from 'sonner'
import type { ExportFormData } from './use-export-project-form'
import { exportConfigOpenAtom } from '@/store'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { formatMap } from '@/components/dashboard/project/exportProjectConfigurations/export-project-format-input'
import type { MimeType } from '@/lib/download-file'
import { downalodFile } from '@/lib/download-file'

const downloadBase64File = (
  base64Contents: string,
  filename: string,
  mimeType: MimeType
) => {
  const decodedString = atob(base64Contents)
  downalodFile(decodedString, filename, mimeType)
}

export const useExportConfigurations = (
  projectSlug: string,
  formData: ExportFormData,
  validateForm: () => boolean
) => {
  const [isLoading, setIsLoading] = useState(false)
  const setIsExportConfigurationDialogOpen = useSetAtom(exportConfigOpenAtom)

  const exportConfigs = useHttp(() => {
    return ControllerInstance.getInstance().projectController.exportProjectConfigurations(
      {
        projectSlug,
        environmentSlugs: formData.environmentSlugs,
        format: formData.format
        // privateKey: formData.privateKey || browserProjectPrivateKey || undefined
      }
    )
  })

  const handleExport = useCallback(async () => {
    if (!validateForm()) return

    setIsLoading(true)
    const loadingToastId = toast.loading('Exporting configurations...')

    try {
      const { data, success } = await exportConfigs()

      if (success && data) {
        const mimeType = formatMap.get(formData.format)?.mimeType as MimeType
        const extension = formatMap.get(formData.format)?.extension ?? 'txt'

        Object.entries(data).forEach(([envSlug, base64Contents]) => {
          const filename = `${envSlug}.${extension}`
          downloadBase64File(base64Contents, filename, mimeType)
        })

        toast.success('Export request successful. Check your downloads.')
      }
    } catch (err) {
      toast.error('An error occurred during export', { id: loadingToastId })
    } finally {
      toast.dismiss(loadingToastId)
      setIsLoading(false)
      setIsExportConfigurationDialogOpen(false)
    }
  }, [exportConfigs, formData.format, setIsExportConfigurationDialogOpen, validateForm])

  return {
    isLoading,
    handleExport
  }
}
