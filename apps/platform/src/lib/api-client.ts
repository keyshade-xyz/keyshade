interface ErrorWithResponse extends Error {
  status: number
  response: Record<string, unknown>
}

class APIClient {
  private baseUrl: string
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async request<T>(url: string, options: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${url}`, options)
    if (!response.ok) {
      const error = new Error(response.statusText) as ErrorWithResponse
      error.status = response.status
      error.response = (await response.json()) as Record<string, unknown> // Add type annotation here
      throw error
    }
    return response.json() as Promise<T>
  }

  /**
   * Sends a GET request to the specified URL and returns a Promise that resolves to the response data.
   * @param url - The URL to send the GET request to.
   * @returns A Promise that resolves to the response data.
   */
  get<T>(url: string): Promise<T> {
    return this.request<T>(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
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
  post<T>(url: string, data: Record<string, unknown>): Promise<T> {
    return this.request<T>(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
  put<T>(url: string, data: Record<string, unknown>): Promise<T> {
    return this.request<T>(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      credentials: 'include'
    })
  }
}

export const apiClient = new APIClient(
  `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`
)
