import { useAtomValue, useSetAtom } from 'jotai'
import { SecretSVG } from '@public/svg/dashboard'
import { Button } from '@/components/ui/button'
import { createSecretOpenAtom, selectedProjectAtom } from '@/store'

export default function EmptySecretListContent(): React.JSX.Element {
  const setIsCreateSecretOpen = useSetAtom(createSecretOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const isAuthorizedToCreateSecrets =
    selectedProject?.entitlements.canCreateSecrets

  return (
    <div className="flex h-[95%] w-full flex-col items-center justify-center gap-y-8">
      <SecretSVG height="100" width="100" />

      <div className="w-121 flex h-20 flex-col items-center justify-center gap-4">
        <p className="w-121 h-10 text-center text-[32px] font-normal">
          Declare your first secret
        </p>
        <p className="w-121 h-6 text-center text-[16px] font-medium">
          Declare and store a secret against different environments
        </p>
      </div>

      <Button
        className="h-9 rounded-md bg-white text-black hover:bg-gray-300"
        disabled={!isAuthorizedToCreateSecrets}
        onClick={() => setIsCreateSecretOpen(true)}
      >
        Create secret
      </Button>
    </div>
  )
}
