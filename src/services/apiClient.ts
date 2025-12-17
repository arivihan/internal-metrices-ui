import { accessToken } from '@/signals/auth'

const BASE_URL = 'https://platform-dev.arivihan.com/internal-metrics'

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

  if (accessToken.value) {
    ;(headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken.value}`
  }

  const response = await fetch(url, {
    ...init,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || 'Request failed')
  }

  return response.json()
}
