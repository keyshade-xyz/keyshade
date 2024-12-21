import { ClientResponse, ResponseError } from '@keyshade/schema'

/**
 * Takes a Response object and parses its contents into a ClientResponse object.
 * This function assumes that the response is either a successful JSON response,
 * or a failed JSON response with an error object in its body.
 *
 * @param {Response} response - The response object to parse.
 * @returns {Promise<ClientResponse<T>>} A promise that resolves to a ClientResponse object.
 */
export async function parseResponse<T>(
  response: Response
): Promise<ClientResponse<T>> {
  if (!response.ok) {
    const error = (await response.json()) as ResponseError
    return {
      success: false,
      data: null,
      error
    } as unknown as ClientResponse<T>
  }

  let data: any = null

  try {
    data = await response.json()
  } catch (error) {}

  return {
    success: true,
    data,
    error: null
  } as unknown as ClientResponse<T>
}
