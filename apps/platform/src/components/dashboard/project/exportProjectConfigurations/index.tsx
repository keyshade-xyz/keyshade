import ExportProjectFormatInput from './export-project-format-input'
import ExportProjectEnvironmentInput from './export-project-environment-input'
import ExportProjectPrivateKeyInput from './export-project-private-key-input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Visible from '@/components/common/visible'
import { useProjectEnvironments } from '@/hooks/api/use-project-environments'
import { useExportProjectDialog } from '@/hooks/screen/project/exportProjectConfigurations/use-export-project-dialog'
import { useExportProjectForm } from '@/hooks/screen/project/exportProjectConfigurations/use-export-project-form'
import { useExportConfigurations } from '@/hooks/screen/project/exportProjectConfigurations/use-export-project-configurations'

export default function ExportProjectConfigurationsDialog(): JSX.Element | null {
  const { environmentsOfProject, selectedProject } = useProjectEnvironments()

  const {
    formData,
    resetForm,
    handleEnvironmentToggle,
    updateFormData,
    validateForm,
    browserProjectPrivateKey
  } = useExportProjectForm()
  const { isExportConfigurationDialogOpen, handleSheetChange } =
    useExportProjectDialog(resetForm, selectedProject)

  const { handleExport, isLoading } = useExportConfigurations(
    selectedProject?.slug ?? '',
    formData,
    validateForm
  )

  if (!selectedProject) {
    return null
  }

  return (
    <Dialog
      onOpenChange={handleSheetChange}
      open={isExportConfigurationDialogOpen}
    >
      <DialogContent className="rounded-[12px] border bg-[#1E1E1F] ">
        <div className="flex w-full flex-col items-start justify-center">
          <DialogTitle className=" font-geist h-[1.875rem] text-[1.125rem] font-semibold text-white ">
            Export Configurations
          </DialogTitle>

          <DialogDescription className=" font-inter h-[1.25rem] w-full text-[0.875rem] font-normal text-[#D4D4D4]">
            Pick options and export selected configurations for project{' '}
            <strong>{selectedProject.name}</strong>
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-y-8 overflow-auto">
          <div className="flex w-full flex-col gap-4 py-4">
            <ExportProjectFormatInput
              onFormatChange={(value: string) =>
                updateFormData({ format: value })
              }
              selectValue={formData.format}
            />
            <ExportProjectEnvironmentInput
              environmentSlugs={formData.environmentSlugs}
              environmentsOfProject={environmentsOfProject}
              onEnvironmentToggle={(slug: string, checked: boolean) =>
                handleEnvironmentToggle(slug, checked)
              }
            />

            <Visible
              if={
                !selectedProject.storePrivateKey && !browserProjectPrivateKey
              }
            >
              <ExportProjectPrivateKeyInput
                onChange={(value: string) =>
                  updateFormData({ privateKey: value })
                }
                privateKey={formData.privateKey}
              />
            </Visible>
          </div>
        </div>
        <div className="flex h-[2.25rem] w-full justify-end">
          <Button
            disabled={isLoading}
            onClick={handleExport}
            type="button"
            variant="secondary"
          >
            {isLoading ? 'Exporting...' : 'Export'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
