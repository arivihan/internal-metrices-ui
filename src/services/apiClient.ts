import { accessToken } from '@/signals/auth'

// Use proxy in development, direct URL in production
const BASE_URL = '/api'
const ANALYTICS_BASE_URL = '/analytics-api'

// Analytics API token (static key for analytics service)
const ANALYTICS_TOKEN = 'a536957dbd17737a22be1fbe367a189ff1537665d8e144edc1ad8a48eabdfe41'

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

/**
 * Analytics API client for user activity data
 */
export const analyticsClient = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const { params, ...init } = config

  let url = `${ANALYTICS_BASE_URL}${endpoint}`
  if (params) {
    const searchParams = new URLSearchParams(params)
    url += `?${searchParams.toString()}`
  }

  const headers: HeadersInit = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${ANALYTICS_TOKEN}`,
    ...init.headers,
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
