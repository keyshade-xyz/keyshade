import { useEffect, useState } from 'react'
import { useAtom, useAtomValue } from 'jotai'
import type { ProjectWithTierLimitAndCount } from '@keyshade/schema'
import {
  selectedProjectPrivateKeyAtom,
  selectedProjectAtom,
  localProjectPrivateKeyAtom
} from '@/store'

export interface UseProjectPrivateKeyResult {
  projectPrivateKey: ProjectWithTierLimitAndCount['privateKey'] | null
  hasServerStoredKey: boolean
  setHasServerStoredKey: React.Dispatch<React.SetStateAction<boolean>>
  loading: boolean
}

export function useProjectPrivateKey(): UseProjectPrivateKeyResult {
  const [projectPrivateKey, setProjectPrivateKey] = useAtom(
    selectedProjectPrivateKeyAtom
  )
  const selectedProject = useAtomValue(selectedProjectAtom)
  const localProjectPrivateKey = useAtomValue(localProjectPrivateKeyAtom)

  const [hasServerStoredKey, setHasServerStoredKey] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true)
    if (!selectedProject) {
      setProjectPrivateKey(null)
      setHasServerStoredKey(false)
      return
    }

    if (selectedProject.storePrivateKey && selectedProject.privateKey) {
      setHasServerStoredKey(true)
      setProjectPrivateKey(selectedProject.privateKey)
    } else {
      const localKey =
        localProjectPrivateKey.find(
          (pair) => pair.slug === selectedProject.slug
        )?.key ?? null
      setHasServerStoredKey(false)
      setProjectPrivateKey(localKey)
    }
    setLoading(false)
  }, [selectedProject, localProjectPrivateKey, setProjectPrivateKey])

  return {
    projectPrivateKey,
    hasServerStoredKey,
    setHasServerStoredKey,
    loading
  }
}
