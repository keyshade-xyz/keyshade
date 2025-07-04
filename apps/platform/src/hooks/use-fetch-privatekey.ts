import { useEffect, useState } from 'react'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import type { ProjectWithTierLimitAndCount } from '@keyshade/schema'
import {
  selectedProjectPrivateKeyAtom,
  localProjectPrivateKeyAtom,
  privateKeyStorageTypeAtom
} from '@/store'

export interface UseProjectPrivateKeyResult {
  projectPrivateKey: ProjectWithTierLimitAndCount['privateKey'] | null
  loading: boolean
}
type PartialProject = Pick<
  ProjectWithTierLimitAndCount,
  'slug' | 'storePrivateKey' | 'privateKey'
>

export function useProjectPrivateKey(
  selectedProject: PartialProject | null
): UseProjectPrivateKeyResult {
  const [projectPrivateKey, setProjectPrivateKey] = useAtom(
    selectedProjectPrivateKeyAtom
  )
  const localProjectPrivateKey = useAtomValue(localProjectPrivateKeyAtom)
  const setPrivateKeyStorageType = useSetAtom(privateKeyStorageTypeAtom)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    setLoading(true)
    if (!selectedProject) {
      setProjectPrivateKey(null)
      setPrivateKeyStorageType('NONE')
      setLoading(false)
      return
    }
    if (selectedProject.storePrivateKey && selectedProject.privateKey) {
      setProjectPrivateKey(selectedProject.privateKey)
      setPrivateKeyStorageType('IN_DB')
      setLoading(false)
      return
    }
    const localKey =
      localProjectPrivateKey.find((pair) => pair.slug === selectedProject.slug)
        ?.key ?? null

    if (localKey) {
      setProjectPrivateKey(localKey)
      setPrivateKeyStorageType('IN_ATOM')
      setLoading(false)
      return
    }
    setProjectPrivateKey(null)
    setPrivateKeyStorageType('NONE')
    setLoading(false)
  }, [
    selectedProject,
    localProjectPrivateKey,
    setProjectPrivateKey,
    setPrivateKeyStorageType
  ])

  return {
    projectPrivateKey,
    loading
  }
}
