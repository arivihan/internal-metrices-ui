import type { SidebarConfig } from '../types/sidebar'
import { apiClient } from './apiClient'

/**
 * Fetch sidebar configuration data from the API
 */
export const fetchSidebarData = async (): Promise<SidebarConfig> => {
  // TODO: Update this endpoint to your actual sidebar config endpoint
  return apiClient<SidebarConfig>('/secure/metrics/sidebar-config')
}

/**
 * Fetch data from any endpoint (for table data, etc.)
 */
export const fetchDataByUrl = async <T = any>(url: string): Promise<T> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error)
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