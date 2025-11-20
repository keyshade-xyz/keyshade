import { useAtomValue, useSetAtom } from 'jotai'
import Image from 'next/image'
import { EmptySecretPNG } from '@public/raster/secret'
import { AddSVG } from '@public/svg/shared'
import ImportEnvButton from '@/components/dashboard/overview/ImportEnvContainer/import-env-button'
import { createSecretOpenAtom, selectedProjectAtom } from '@/store'
import { Button } from '@/components/ui/button'

export default function EmptySecretListContent(): React.JSX.Element {
  const setIsCreateSecretOpen = useSetAtom(createSecretOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const isAuthorizedToCreateSecrets =
    selectedProject?.entitlements.canCreateSecrets

  return (
    <div className="flex h-[65vh] w-full flex-col items-center justify-center gap-y-8">
      <Image
        alt="empty secret"
        draggable={false}
        placeholder="blur"
        quality={100}
        src={EmptySecretPNG}
      />

      <div className="w-121 flex h-20 flex-col items-center justify-center gap-4">
        <p className="w-121 h-10 text-center text-[28px] font-medium">
          Create your first Secret
        </p>
        <p className="w-[300px] text-center text-neutral-500">
          When you add a secret, it’s encrypted on your side. Even Keyshade
          can’t peek.{' '}
        </p>
      </div>
      <div className="flex gap-x-2.5">
        <ImportEnvButton projectSlug={selectedProject?.slug} />
        <Button
          disabled={!isAuthorizedToCreateSecrets}
          onClick={() => setIsCreateSecretOpen(true)}
        >
          <AddSVG />
          Create secret
        </Button>
      </div>
    </div>
  )
}
