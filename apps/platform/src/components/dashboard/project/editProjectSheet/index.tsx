import { useAtom } from 'jotai'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { editProjectSheetOpen } from '@/store'

export default function EditProjectSheet(): JSX.Element {
  const [isEditProjectSheetOpen, setIsEditProjectSheetOpen] =
    useAtom(editProjectSheetOpen)

  return (
    <Sheet
      onOpenChange={(open) => {
        setIsEditProjectSheetOpen(open)
      }}
      open={isEditProjectSheetOpen}
    >
      <SheetContent className="border-white/15 bg-[#222425]">
        <SheetHeader>
          <SheetTitle className="text-white">Edit Project</SheetTitle>
          <SheetDescription>
            Make changes to the project details
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-start gap-4">
            <Label className="text-right" htmlFor="name">
              Project Name
            </Label>
            <Input className="col-span-3" id="name" />
          </div>
          <div className="flex flex-col items-start gap-4">
            <Label className="text-right" htmlFor="name">
              Project description
            </Label>
            <Input className="col-span-3" id="name" />
          </div>

          <div className="flex items-center justify-between">
            <Label className="w-[10rem] text-left" htmlFor="name">
              Do you want us to store the private key?
            </Label>
            <div className="flex gap-1 text-sm">
              <div>No</div>
              <Switch />
              <div>Yes</div>
            </div>
          </div>
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit" variant="secondary">
              Save changes
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
