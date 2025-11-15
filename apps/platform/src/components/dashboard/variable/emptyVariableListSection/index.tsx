import { useAtomValue, useSetAtom } from 'jotai'
import Image from 'next/image'
import { AddSVG } from '@public/svg/shared'
import { EmptyFolderVariablePNG } from '@public/raster/variable'
import ImportEnvButton from '../../overview/ImportEnvContainer/import-env-button'
import { createVariableOpenAtom, selectedProjectAtom } from '@/store'
import { Button } from '@/components/ui/button'

export default function EmptyVariableListContent(): React.JSX.Element {
  const setIsCreateVariableOpen = useSetAtom(createVariableOpenAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const isAuthorizedToCreateVariables =
    selectedProject?.entitlements.canCreateVariables

  return (
    <div className="flex h-[65vh] w-full flex-col items-center justify-center gap-y-8">
      <Image
        alt="empty variable"
        draggable={false}
        placeholder="blur"
        quality={100}
        src={EmptyFolderVariablePNG}
      />

      <div className="w-121 flex h-20 flex-col items-center justify-center gap-4">
        <p className="w-121 h-10 text-center text-[28px] font-medium">
          Create your first Variable
        </p>
        <p className="w-[300px] text-center text-neutral-500">
          Add variables to manage environment-specific values from one place.
        </p>
      </div>
      <div className="flex gap-x-2.5">
        <ImportEnvButton projectSlug={selectedProject?.slug} />
        <Button
          disabled={!isAuthorizedToCreateVariables}
          onClick={() => setIsCreateVariableOpen(true)}
        >
          <AddSVG />
          Create variable
        </Button>
      </div>
    </div>
  )
}
