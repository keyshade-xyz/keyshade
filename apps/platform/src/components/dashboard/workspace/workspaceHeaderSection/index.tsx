import { useAtomValue } from 'jotai'
import CopyToClipboard from '@/components/common/copy-to-clipboard'
import { selectedWorkspaceAtom } from '@/store'
import AvatarComponent from '@/components/common/avatar'
import { formatDate } from '@/lib/utils'

export default function WorkspaceHeaderSection(): React.JSX.Element {
  const selectedWorkspace = useAtomValue(selectedWorkspaceAtom)

  return (
    <section className="flex flex-col gap-2.5 py-4">
      <div className="flex items-center gap-x-2">
        <h1 className="text-2xl font-bold">{selectedWorkspace?.name}</h1>
        <CopyToClipboard text={selectedWorkspace?.slug || ''} />
      </div>
      {selectedWorkspace ? (
        <div className="mb-5 flex items-center gap-x-2 text-sm text-white/70">
          <span>Currently owned by</span>
          <span className="font-semibold text-white">
            {selectedWorkspace.ownedBy.name}
          </span>
          <AvatarComponent
            name={selectedWorkspace.ownedBy.name}
            src={selectedWorkspace.ownedBy.profilePictureUrl}
          />
          <span>since</span>
          <span className="font-semibold text-white">
            {formatDate(selectedWorkspace.ownedBy.ownedSince)}
          </span>
        </div>
      ) : null}
      <p className="text-lg font-medium text-white/60">
        Update & manage your workspace.
      </p>
    </section>
  )
}
