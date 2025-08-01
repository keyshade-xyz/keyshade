import { useAtomValue, useSetAtom } from 'jotai'
import { EnvironmentSVG } from '@public/svg/dashboard'
import { Button } from '@/components/ui/button'
import { createEnvironmentOpenAtom, selectedProjectAtom } from '@/store'

export default function EmptyEnvironmentListContent(): React.JSX.Element {
  const setIsCreateEnvironmentOpen = useSetAtom(createEnvironmentOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const isAuthorizedToCreateEnvironments =
    selectedProject?.entitlements.canCreateEnvironments

  return (
    <div className="flex h-[95%] w-full flex-col items-center justify-center gap-y-8">
      <EnvironmentSVG width={100} />

      <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4">
        <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
          Declare your first environment
        </p>
        <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500]">
          Declare and store a environment against different environments
        </p>
      </div>

      <Button
        className="h-[2.25rem] rounded-md bg-white text-black hover:bg-gray-300"
        disabled={!isAuthorizedToCreateEnvironments}
        onClick={() => setIsCreateEnvironmentOpen(true)}
      >
        Create environment
      </Button>
    </div>
  )
}
