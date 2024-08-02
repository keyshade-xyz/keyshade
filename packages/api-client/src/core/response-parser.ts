import { ClientResponse, ResponseError } from '../types/index.types'

export async function parseResponse<T>(
  response: Response
): Promise<ClientResponse<T>> {
  if (!response.ok) {
    const error = (await response.json()) as ResponseError
    return {
      success: false,
      data: null,
      error
    } as ClientResponse<T>
  }

  let data: any = null

  try {
    data = await response.json()
  } catch (error) {}

  return {
    success: true,
    data,
    error: null
  } as ClientResponse<T>
}
