import { accessToken } from '@/signals/auth'

// Use environment variable or fallback to proxy in development
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'
const ANALYTICS_BASE_URL = '/analytics-api'

// Analytics API token (static key for analytics service)
const ANALYTICS_TOKEN = 'a536957dbd17737a22be1fbe367a189ff1537665d8e144edc1ad8a48eabdfe41'

// Log environment configuration on module load
console.log('[apiClient] 📍 VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL)
console.log('[apiClient] 📍 BASE_URL:', BASE_URL)

interface RequestConfig extends RequestInit {
  params?: Record<string, string>
}

export const apiClient = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  const { params, ...init } = config

  // Construct URL with proper slash handling
let url: string;
if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
  // Absolute URL - use as is
  url = endpoint;
} else {
  // Relative URL - prepend BASE_URL
  url = endpoint.startsWith('/') ? `${BASE_URL}${endpoint}` : `${BASE_URL}/${endpoint}`;
}
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

  // Create absolute URL for logging
  const absoluteUrl = new URL(url, window.location.origin).href
  
  console.log(`[apiClient] 🔗 ${init.method || 'GET'}`)
  console.log(`[apiClient] 📍 Base URL: ${BASE_URL}`)
  console.log(`[apiClient] 📍 Endpoint: ${endpoint}`)
  console.log(`[apiClient] 📍 Relative URL: ${url}`)
  console.log(`[apiClient] 📍 Absolute URL: ${absoluteUrl}`)

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include', // Include cookies in requests
  })

  console.log(`[apiClient] 📊 Response Status: ${response.status}`)

  // Handle 204 No Content - successful response with no body
  if (response.status === 204) {
    console.log(`[apiClient] ✅ No Content Response (204)`)
    return { success: true, status: 204 } as T
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    console.error(`[apiClient] ❌ Error:`, error)

    // Build detailed error message including validation errors
    let errorMessage = error.message || 'Request failed'
    if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
      const errorDetails = error.errors
        .map((e: any) => e.field ? `${e.field}: ${e.message || e.defaultMessage}` : (e.message || e.defaultMessage || e))
        .join(', ')
      errorMessage = `${errorMessage} - ${errorDetails}`
      console.error(`[apiClient] ❌ Validation errors:`, error.errors)
    }

    throw new Error(errorMessage)
  }

  // Check content-type before parsing
  const contentType = response.headers.get('content-type')

  // Handle text/plain responses (some APIs return plain text for success/error messages)
  if (contentType?.includes('text/plain')) {
    const textResponse = await response.text()
    console.log(`[apiClient] 📝 Text Response:`, textResponse)

    // Check if the text response indicates an error (contains common error phrases)
    const lowerText = textResponse.toLowerCase()
    const isErrorMessage =
      lowerText.includes('cannot') ||
      lowerText.includes('error') ||
      lowerText.includes('failed') ||
      lowerText.includes('invalid') ||
      lowerText.includes('not allowed') ||
      lowerText.includes('not found') ||
      lowerText.includes('unauthorized') ||
      lowerText.includes('forbidden') ||
      lowerText.includes('please contact')

    if (isErrorMessage) {
      console.error(`[apiClient] ❌ Error in text response:`, textResponse)
      throw new Error(textResponse)
    }

    // Return as a success object with the message
    return { success: true, message: textResponse } as T
  }

  if (!contentType || !contentType.includes('application/json')) {
    console.error(`[apiClient] ❌ Invalid content-type: ${contentType}`)
    const bodyText = await response.text()
    console.error(`[apiClient] ❌ Response body:`, bodyText)
    throw new Error(bodyText || `Expected JSON but got ${contentType || 'unknown'} content type`)
  }

  const data = await response.json()
  console.log(`[apiClient] ✅ Response:`, data)
  return data
}

/**
 * DYNAMIC request helper - uses method from config
 */
export const dynamicRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  config: RequestConfig = {}
): Promise<T> => {
  const requestConfig: RequestConfig = {
    ...config,
    method: method.toUpperCase(),
  }

  // Add body for methods that support it
  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    requestConfig.body = JSON.stringify(data)
  }

  return apiClient<T>(endpoint, requestConfig)
}

/**
 * POST request helper
 */
export const postData = async <T>(
  endpoint: string,
  data: any,
  config: RequestConfig = {}
): Promise<T> => {
  return apiClient<T>(endpoint, {
    ...config,
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * PUT request helper
 */
export const putData = async <T>(
  endpoint: string,
  data: any,
  config: RequestConfig = {}
): Promise<T> => {
  return apiClient<T>(endpoint, {
    ...config,
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

/**
 * PATCH request helper
 */
export const patchData = async <T>(
  endpoint: string,
  data: any,
  config: RequestConfig = {}
): Promise<T> => {
  return apiClient<T>(endpoint, {
    ...config,
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

/**
 * DELETE request helper
 */
export const deleteData = async <T>(
  endpoint: string,
  config: RequestConfig = {}
): Promise<T> => {
  return apiClient<T>(endpoint, {
    ...config,
    method: 'DELETE',
  })
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