import { z } from 'zod'
import { zSecret, type Secret } from '@/types'
import { apiClient } from '../api-client'

async function getAllSecretbyProjectId(
  projectId: string
): Promise<Secret[] | undefined> {
  try {
    const secretData = await apiClient.get<Secret[]>(`/secret/${projectId}`)

    const zSecretArray = z.array(zSecret)

    const { success, data } = zSecretArray.safeParse(secretData)
    if (!success) {
      throw new Error('Invalid data')
    }
    return data
  } catch (error) {
    // eslint-disable-next-line no-console -- we need to log the error
    console.error(error)
  }
}

export const Secrets = {
  getAllSecretbyProjectId
}
