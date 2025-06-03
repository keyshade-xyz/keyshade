import { useAtom, useSetAtom } from 'jotai'
import { useEffect, useState } from 'react'
import type { ExportProjectRequest } from '@keyshade/schema'
import {
  environmentsOfProjectAtom,
  exportConfigOpenAtom,
  selectedProjectAtom
} from '@/store'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
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

const formatOptions = [{ label: 'JSON', value: 'json' }]

export default function ExportProjectConfigurationsSheet(): JSX.Element | null {
  const [isExportConfigurationSheetOpen, setIsExportConfigurationSheetOpen] =
    useAtom(exportConfigOpenAtom)
  const [selectedProject] = useAtom(selectedProjectAtom)
  const [environmentsOfProject] = useAtom(environmentsOfProjectAtom)

  const setEnvironments = useSetAtom(environmentsOfProjectAtom)

  const [formData, setFormData] = useState<
    Omit<ExportProjectRequest, 'projectSlug'>
  >({
    environmentSlugs: [],
    format: '',
    privateKey: ''
  })

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
    if (isExportConfigurationSheetOpen && selectedProject) {
      setFormData({
        environmentSlugs: [],
        format: '',
        privateKey: ''
      })
    }
  }, [isExportConfigurationSheetOpen, selectedProject])

  const handleSheetChange = (open: boolean) => {
    setIsExportConfigurationSheetOpen(open)
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

  if (!selectedProject) {
    return null
  }

  return (
    <Sheet
      onOpenChange={handleSheetChange}
      open={isExportConfigurationSheetOpen}
    >
      <SheetContent className="border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Export Configurations</SheetTitle>
          <SheetDescription>
            Pick options and export selected configurations for project{' '}
            <strong>{selectedProject.name}</strong>
          </SheetDescription>
        </SheetHeader>

        <div className="grid gap-4 py-4">
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
              <SelectContent>
                {formatOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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

          <div className="flex flex-col items-start gap-4">
            <Label htmlFor="privateKey">Private Key (optional)</Label>
            <Input
              id="privateKey"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData((prev) => ({ ...prev, privateKey: e.target.value }))
              }
              placeholder="Paste private key here"
              type="password"
              value={formData.privateKey}
            />
          </div>
        </div>

        <SheetFooter>
          <Button disabled type="button">
            Export
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
