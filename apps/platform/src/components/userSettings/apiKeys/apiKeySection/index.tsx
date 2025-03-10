import { useEffect, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import { useSearchParams } from 'next/navigation'
import type { ApiKey } from '@keyshade/schema'
import ConfirmDeleteApiKey from '../confirmDeleteApiKey'
import AddApiKeyDialog from '../addApiKeyDialog'
import ApiKeyCard from '../apiKeyCard'
import EditApiKeySheet from '../editApiKeySheet'
import {
  apiKeysOfProjectAtom,
  deleteApiKeyOpenAtom,
  editApiKeyOpenAtom,
  selectedApiKeyAtom
} from '@/store'
import ControllerInstance from '@/lib/controller-instance'
import { useHttp } from '@/hooks/use-http'
import InputLoading from '@/components/common/input-loading'

export default function ApiKeySection(): React.JSX.Element {
  const [apiKeys, setApiKeys] = useAtom(apiKeysOfProjectAtom)
  const isDeleteApiKeyOpen = useAtomValue(deleteApiKeyOpenAtom)
  const isEditApiKeyOpen = useAtomValue(editApiKeyOpenAtom)
  const selectedApiKey = useAtomValue(selectedApiKeyAtom)

  const searchParams = useSearchParams()
  const tab = searchParams.get('profile') ?? 'profile'

  const [isLoading, setIsLoading] = useState(true)

  const getApiKeysOfUser = useHttp(() =>
    ControllerInstance.getInstance().apiKeyController.getApiKeysOfUser({})
  )

  useEffect(() => {
    getApiKeysOfUser()
      .then(({ data, success }) => {
        if (success && data) {
          setApiKeys(data.items as ApiKey[])
        }
      })
      .finally(() => setIsLoading(false))
  }, [getApiKeysOfUser, setApiKeys])

  return (
    <>
      <div className="flex flex-row items-center justify-between gap-4 p-3">
        <div className="flex flex-col gap-2">
          <div className="text-xl font-semibold">API Keys</div>
          <span className="text-sm text-white/70">
            Generate new API keys to use with the Keyshade CLI.
          </span>
        </div>
        <div>{tab === 'profile' && <AddApiKeyDialog />}</div>
      </div>

      {isLoading ? (
        <div className="p-3">
          <InputLoading />
        </div>
      ) : (
        apiKeys.length !== 0 && (
          <div
            className={`grid h-fit w-full grid-cols-1 gap-8 p-3 text-white md:grid-cols-2 xl:grid-cols-3 `}
          >
            {apiKeys.map((apiKey) => (
              <ApiKeyCard apiKey={apiKey} key={apiKey.id} />
            ))}

            {/* Edit API key sheet */}
            {isEditApiKeyOpen && selectedApiKey ? <EditApiKeySheet /> : null}

            {/* Delete API Key alert dialog */}
            {isDeleteApiKeyOpen && selectedApiKey ? (
              <ConfirmDeleteApiKey />
            ) : null}
          </div>
        )
      )}
    </>
  )
}
