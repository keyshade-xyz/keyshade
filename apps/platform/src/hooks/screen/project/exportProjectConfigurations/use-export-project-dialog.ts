import { useEffect } from 'react'
import { useAtom } from 'jotai'
import type { ProjectWithTierLimitAndCount } from '@keyshade/schema'
import { exportConfigOpenAtom } from '@/store'

export const useExportProjectDialog = (resetForm: () => void, selectedProject: ProjectWithTierLimitAndCount | null) => {
  const [isExportConfigurationDialogOpen, setIsExportConfigurationDialogOpen] =
    useAtom(exportConfigOpenAtom)

  useEffect(() => {
    if (isExportConfigurationDialogOpen && selectedProject) {
      resetForm()
    }
  }, [isExportConfigurationDialogOpen, selectedProject, resetForm])

  const handleSheetChange = (open: boolean) => {
    setIsExportConfigurationDialogOpen(open)
  }

  return {
    isExportConfigurationDialogOpen,
    handleSheetChange
  }
}