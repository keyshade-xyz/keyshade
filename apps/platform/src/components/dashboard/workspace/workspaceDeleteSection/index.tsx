import { useAtomValue, useSetAtom } from 'jotai'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'
import { deleteWorkspaceOpenAtom, selectedWorkspaceAtom } from '@/store'

export default function WorkspaceDeleteSection(): React.JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)
  const setIsDeleteWorkspaceOpen = useSetAtom(deleteWorkspaceOpenAtom)

  return (
    <section className="mt-20">
      <div className="flex w-[782px] items-center gap-4 rounded-3xl border-2 border-[#E92D1F] bg-[#21191A] px-6 py-8">
        <div className="flex flex-col gap-2">
          <h4 className="text-2xl font-bold text-[#E92D1F]">
            Delete Workspace
          </h4>
          <p className="text-md font-medium text-white/60">
            Your workspace will be permanently deleted and access will be lost
            to any of your teams and data. This action is irreversible.
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button
                className="bg-[#E92D1F] text-white hover:bg-[#E92D1F]/80"
                disabled={selectedWorkspace?.isDefault}
                onClick={() => setIsDeleteWorkspaceOpen(true)}
              >
                Delete
              </Button>
            </TooltipTrigger>
            {selectedWorkspace?.isDefault ? (
              <TooltipContent>
                <p>
                  The current workspace is set as the default and cannot be
                  deleted.
                </p>
              </TooltipContent>
            ) : null}
          </Tooltip>
        </TooltipProvider>
      </div>
    </section>
  )
}
