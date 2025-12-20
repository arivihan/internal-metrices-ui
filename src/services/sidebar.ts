import type { SidebarConfig } from '../types/sidebar'

// Use environment variable for API URL
const SIDEBAR_API_URL = import.meta.env.VITE_SIDEBAR_API_URL 

/**
 * Fetch sidebar configuration data from the API
 */
export const fetchSidebarData = async (): Promise<SidebarConfig> => {
  try {
    const response = await fetch(SIDEBAR_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
    console.log("========================================")
    console.log(data)
    console.log("========================================")
  } catch (error) {
    console.error('Error fetching sidebar data:', error)
    throw error
  }
}

/**
 * Fetch data from any endpoint (for table data, etc.)
 */
export const fetchDataByUrl = async <T = any>(url: string): Promise<T> => {
  try {
    console.log(`[fetchDataByUrl] Fetching from: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log(`[fetchDataByUrl] Success:`, data);
    return data
  } catch (error) {
    console.error(`[fetchDataByUrl] Error fetching data from ${url}:`, error)
    throw error
  }
}

/**
 * Submit form data to an endpoint
 */
export const submitFormData = async <T = any>(url: string, data: any): Promise<T> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Error submitting data to ${url}:`, error)
    throw error
  }
}