import { useEffect, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import {
  selectedProjectPrivateKeyAtom,
  selectedProjectAtom,
  localProjectPrivateKeyAtom
} from '@/store'

export interface UseProjectPrivateKeyResult {
  privateKey: string | null
  hasServerStoredKey: boolean
  setHasServerStoredKey: React.Dispatch<React.SetStateAction<boolean>>
  loading: boolean
}

export function useProjectPrivateKey(): UseProjectPrivateKeyResult {
  const [privateKey, setPrivateKey] = useAtom(selectedProjectPrivateKeyAtom)
  const selectedProject = useAtomValue(selectedProjectAtom)
  const localKeys = useAtomValue(localProjectPrivateKeyAtom)

  const [hasServerStoredKey, setHasServerStoredKey] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true)
    if (!selectedProject) {
      setPrivateKey(null)
      setHasServerStoredKey(false)
      return
    }

    if (selectedProject.storePrivateKey && selectedProject.privateKey) {
      setHasServerStoredKey(true)
      setPrivateKey(selectedProject.privateKey)
    } else {
      const localKey =
        localKeys.find((pair) => pair.slug === selectedProject.slug)?.key ??
        null
      setHasServerStoredKey(false)
      setPrivateKey(localKey)
    }
    setLoading(false)
  }, [selectedProject, localKeys, setPrivateKey])

  return { privateKey, hasServerStoredKey, setHasServerStoredKey, loading }
}
