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

      <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4">
        <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
          Declare your first variable
        </p>
        <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500]">
          Declare and store a variable against different environments
        </p>
      </div>

      <Button
        className="h-[2.25rem] rounded-md bg-white text-black hover:bg-gray-300"
        disabled={!isAuthorizedToCreateVariables}
        onClick={() => setIsCreateVariableOpen(true)}
      >
        Create variable
      </Button>
    </div>
  )
}
