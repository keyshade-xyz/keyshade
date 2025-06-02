import { useAtom } from 'jotai'
import { exportConfigOpenAtom, selectedProjectAtom } from '@/store'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'

export default function ExportProjectConfigurationsSheet(): JSX.Element | null {
  const [isExportConfigurationSheetOpen, setIsExportConfigurationSheetOpen] =
    useAtom(exportConfigOpenAtom)

  const [selectedProject] = useAtom(selectedProjectAtom)

  const handleSheetChange = (open: boolean) => {
    setIsExportConfigurationSheetOpen(open)
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

        <div className="grid gap-4 py-4" />

        <SheetFooter>
          <Button disabled type="button">
            Export
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
