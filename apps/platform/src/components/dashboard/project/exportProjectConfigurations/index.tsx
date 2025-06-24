import { useAtom, useSetAtom } from 'jotai'
import { useCallback, useEffect, useState } from 'react'
import type { ExportProjectRequest } from '@keyshade/schema'
import { toast } from 'sonner'
import { buildEnvFiles, EXPORT_FORMAT_INFO } from '@keyshade/common'
import {
  environmentsOfProjectAtom,
  exportConfigOpenAtom,
  selectedProjectAtom
} from '@/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useHttp } from '@/hooks/use-http'
import ControllerInstance from '@/lib/controller-instance'
import { Input } from '@/components/ui/input'
import { useProjectPrivateKey } from '@/hooks/use-fetch-privatekey'
import { Switch } from '@/components/ui/switch'

const formatMap = new Map(Object.entries(EXPORT_FORMAT_INFO))

const download = (file: string, filename: string, mimeType: string) => {
  const blob = new Blob([file], { type: mimeType })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function ExportProjectConfigurationsDialog(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(false)
  const [isExportConfigurationDialogOpen, setIsExportConfigurationDialogOpen] =
    useAtom(exportConfigOpenAtom)
  const [selectedProject] = useAtom(selectedProjectAtom)
  const [environmentsOfProject] = useAtom(environmentsOfProjectAtom)

  const setEnvironments = useSetAtom(environmentsOfProjectAtom)

  const [formData, setFormData] = useState<
    Omit<ExportProjectRequest, 'projectSlug'> & {
      format: string
      privateKey: string
      separateFiles: boolean
    }
  >({
    environmentSlugs: [],
    format: '',
    privateKey: '',
    separateFiles: false
  })

  const { projectPrivateKey: browserProjectPrivateKey } = useProjectPrivateKey()

  const fetchEnvironments = useHttp(() =>
    ControllerInstance.getInstance().environmentController.getAllEnvironmentsOfProject(
      {
        projectSlug: selectedProject!.slug
      }
    )
  )

  useEffect(() => {
    if (!selectedProject) return

    fetchEnvironments().then(({ data, success }) => {
      if (success && data) {
        setEnvironments(data.items)
      }
    })
  }, [selectedProject, fetchEnvironments, setEnvironments])

  useEffect(() => {
    if (isExportConfigurationDialogOpen && selectedProject) {
      setFormData({
        environmentSlugs: [],
        format: '',
        privateKey: '',
        separateFiles: false
      })
    }
  }, [isExportConfigurationDialogOpen, selectedProject])

  const handleDialogChange = (open: boolean) => {
    setIsExportConfigurationDialogOpen(open)
  }

  const handleEnvironmentToggle = (slug: string, checked: boolean) => {
    setFormData((prev) => {
      const set = new Set(prev.environmentSlugs)
      if (checked) {
        set.add(slug)
      } else {
        set.delete(slug)
      }
      return { ...prev, environmentSlugs: Array.from(set) }
    })
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      separateFiles: checked
    }))
  }

  const exportConfigs = useHttp(() => {
    return ControllerInstance.getInstance().projectController.exportProjectConfigurations(
      {
        projectSlug: selectedProject!.slug,
        environmentSlugs: formData.environmentSlugs
      }
    )
  })

  const handleExport = useCallback(async () => {
    if (!selectedProject) {
      toast.error('No project selected')
      return
    }

    if (formData.environmentSlugs.length < 1) {
      toast.error('Please select at least one environment')
      return
    }
    if (!formData.format) {
      toast.error('Please pick a format')
      return
    }

    const privateKey = formData.privateKey || browserProjectPrivateKey

    if (!privateKey) {
      toast.error('Private Key is required for this project')
      return
    }

    setIsLoading(true)
    const loadingToastId = toast.loading('Exporting configurations...')

    try {
      const { data, success } = await exportConfigs()

      if (success && data) {
        const mimeType =
          formatMap.get(formData.format)?.mimeType ?? 'text/plain'
        const extension = formatMap.get(formData.format)?.extension ?? 'txt'
        try {
          const fileArrays = await Promise.all(
            Object.entries(data).map(
              ([env, { secrets = [], variables = [] }]) =>
                buildEnvFiles(
                  env,
                  secrets,
                  variables,
                  privateKey,
                  formData.format,
                  formData.separateFiles
                )
            )
          )

          const allFiles = fileArrays.flat()

          allFiles.forEach(({ filename, content }) =>
            download(content, `${filename}.${extension}`, mimeType)
          )

          toast.success('Export request successful. Check your downloads.')
        } catch (err) {
          toast.error(
            `An error occurred: ${err instanceof Error ? err.message : err}`
          )
        }
      }
    } catch (err) {
      toast.error('An error occurred during export', { id: loadingToastId })
    } finally {
      toast.dismiss(loadingToastId)
      setIsLoading(false)
      setIsExportConfigurationDialogOpen(false)
    }
  }, [
    selectedProject,
    formData,
    browserProjectPrivateKey,
    exportConfigs,
    setIsExportConfigurationDialogOpen
  ])

  if (!selectedProject) {
    return null
  }

  return (
    <Dialog
      onOpenChange={handleDialogChange}
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
            <div className="flex flex-col items-start gap-4">
              <Label htmlFor="format">Export Format</Label>
              <Select
                name="format"
                onValueChange={(value: string) =>
                  setFormData((prev) => ({ ...prev, format: value }))
                }
                value={formData.format}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent className="bg-neutral-800">
                  {[...formatMap].map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col items-start gap-4">
              <Label className="mb-2">Choose Environments</Label>
              <div className="space-y-1">
                {environmentsOfProject.map(
                  (env: { slug: string; name: string }) => (
                    <div className="flex items-center gap-2" key={env.slug}>
                      <Checkbox
                        checked={formData.environmentSlugs.includes(env.slug)}
                        name={`env-${env.slug}`}
                        onCheckedChange={(checked: boolean) =>
                          handleEnvironmentToggle(env.slug, checked)
                        }
                      />
                      <Label htmlFor={`env-${env.slug}`}>{env.name}</Label>
                    </div>
                  )
                )}
              </div>
            </div>

            {!browserProjectPrivateKey && (
              <div className="flex flex-col items-start gap-4">
                <Label htmlFor="privateKey">Private Key</Label>
                <Input
                  id="privateKey"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev) => ({
                      ...prev,
                      privateKey: e.target.value
                    }))
                  }
                  placeholder="Paste private key here"
                  type="password"
                  value={formData.privateKey}
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label className="text-left" htmlFor="storePrivateKey">
                Separate files for secrets and variables?
              </Label>
              <div className="flex gap-1 text-sm">
                <div>No</div>
                <Switch
                  checked={formData.separateFiles}
                  id="separateFiles"
                  onCheckedChange={handleSwitchChange}
                />
                <div>Yes</div>
              </div>
            </div>
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
