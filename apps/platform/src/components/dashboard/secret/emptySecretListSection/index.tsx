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

      <div className="flex h-[5rem] w-[30.25rem] flex-col items-center justify-center gap-4">
        <p className="h-[2.5rem] w-[30.25rem] text-center text-[32px] font-[400]">
          Declare your first secret
        </p>
        <p className="h-[1.5rem] w-[30.25rem] text-center text-[16px] font-[500]">
          Declare and store a secret against different environments
        </p>
      </div>

      <Button
        className="h-[2.25rem]"
        disabled={!isAuthorizedToCreateSecrets}
        onClick={() => setIsCreateSecretOpen(true)}
        variant="primary"
      >
        Create secret
      </Button>
    </div>
  )
}
