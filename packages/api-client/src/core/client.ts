export class APIClient {
  constructor(private readonly baseUrl: string) {}

  async request(url: string, options: RequestInit): Promise<Response> {
    return await fetch(`${this.baseUrl}${url}`, options)
  }

  /**
   * Sends a GET request to the specified URL and returns a Promise that resolves to the response data.
   * @param url - The URL to send the GET request to.
   * @returns A Promise that resolves to the response data.
   */
  get(url: string, headers?: Record<string, string>): Promise<Response> {
    return this.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials: 'include'
    })
  }

  /**
   * Sends a POST request to the specified URL with the provided data.
   *
   * @param url - The URL to send the request to.
   * @param data - The data to send in the request body.
   * @returns A Promise that resolves to the response data.
   */
  post(
    url: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<Response> {
    return this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
      credentials: 'include'
    })
  }

  /**
   * Sends a PUT request to the specified URL with the provided data.
   *
   * @param url - The URL to send the request to.
   * @param data - The data to be sent in the request body.
   * @returns A Promise that resolves to the response data.
   */
  put(
    url: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<Response> {
    return this.request(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data),
      credentials: 'include'
    })
  }

  /**
   * Sends a DELETE request to the specified URL and returns a Promise that resolves to the response data.
   *
   * @param url - The URL to send the DELETE request to.
   * @param headers - Optional headers to include in the request.
   * @returns A Promise that resolves to the response data.
   */
  delete(
    url: string,
    headers?: Record<string, string>,
    data?: any
  ): Promise<Response> {
    return this.request(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials: 'include'
    })
  }
}
