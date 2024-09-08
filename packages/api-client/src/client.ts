interface ErrorWithResponse extends Error {
  status: number
  response: Record<string, unknown>
}

class APIClient {
  private baseUrl: string

  private static instance: APIClient | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  static getInstance(): APIClient {
    if (!this.instance) {
      this.instance = new APIClient(process.env.BACKEND_URL as string)
    }
    return this.instance
  }

  async request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, options)
    if (!response.ok) {
      const error = new Error(response.statusText) as ErrorWithResponse
      error.status = response.status
      error.response = (await response.json()) as Record<string, unknown>
      throw error
    }

    try {
      return (await response.json()) as T
    } catch (e) {
      return response as T
    }
  }

  /**
   * Sends a GET request to the specified URL and returns a Promise that resolves to the response data.
   * @param url - The URL to send the GET request to.
   * @returns A Promise that resolves to the response data.
   */
  get<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, {
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
  post<T>(
    url: string,
    data: any,
    headers?: Record<string, string>
  ): Promise<T> {
    return this.request<T>(url, {
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
  put<T>(url: string, data: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, {
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
   * @returns A Promise that resolves to the response data.
   */
  delete<T>(url: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      credentials: 'include'
    })
  }
}

const client = APIClient.getInstance()

export default client
