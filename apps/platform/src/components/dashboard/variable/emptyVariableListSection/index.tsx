import { useAtomValue, useSetAtom } from 'jotai'
import { VariableSVG } from '@public/svg/dashboard'
import { Button } from '@/components/ui/button'
import { createVariableOpenAtom, selectedProjectAtom } from '@/store'

export default function EmptyVariableListContent(): React.JSX.Element {
  const setIsCreateVariableOpen = useSetAtom(createVariableOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const isAuthorizedToCreateVariables =
    selectedProject?.entitlements.canCreateVariables

  return (
    <div className="flex h-[95%] w-full flex-col items-center justify-center gap-y-8">
      <VariableSVG width="100" />

      <div className="flex h-20 w-121 flex-col items-center justify-center gap-4">
        <p className="h-10 w-121 text-center text-[32px] font-normal">
          Declare your first variable
        </p>
        <p className="h-6 w-121 text-center text-[16px] font-medium">
          Declare and store a variable against different environments
        </p>
      </div>

      <Button
        className="h-9 rounded-md bg-white text-black hover:bg-gray-300"
        disabled={!isAuthorizedToCreateVariables}
        onClick={() => setIsCreateVariableOpen(true)}
      >
        Create variable
      </Button>
    </div>
  )
}
