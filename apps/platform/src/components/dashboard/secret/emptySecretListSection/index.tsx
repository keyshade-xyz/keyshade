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
      <SecretSVG width="100" />

      <div className="flex h-20 w-121 flex-col items-center justify-center gap-4">
        <p className="h-10 w-121 text-center text-[32px] font-normal">
          Declare your first secret
        </p>
        <p className="h-6 w-121 text-center text-[16px] font-medium">
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
