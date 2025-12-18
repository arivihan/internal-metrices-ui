import { accessToken } from '@/signals/auth'

// Use proxy in development, direct URL in production
const BASE_URL = '/api'

interface RequestConfig extends RequestInit {
  params?: Record<string, string>
}

export const apiClient = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const { params, ...init } = config

  let url = `${BASE_URL}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...init.headers,
  }

  // Add token as header for authenticated requests
  if (accessToken.value) {
    ;(headers as Record<string, string>)['avToken'] = accessToken.value
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include', // Include cookies in requests
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}
