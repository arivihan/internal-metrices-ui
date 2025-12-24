import { apiClient } from './apiClient'

// Types for dashboard select API
export interface DashboardService {
  name: string
  url: string
  iconUrl: string
  accessibleToRoles: string[]
}

export interface DashboardServicesData {
  inHouseServices: DashboardService[]
  externalServices: DashboardService[]
}

interface DashboardServicesApiResponse {
  code: string
  message: string | null
  success: boolean
  data: DashboardServicesData
  size: number | null
  page: number | null
}

/**
 * Fetch dashboard services (in-house and external) from the API
 */
export const fetchDashboardServices = async (): Promise<DashboardServicesData> => {
  try {
    const response = await apiClient<DashboardServicesApiResponse>(
      '/secure/ui/fetch-component-configs/dashboard-services'
    )
    return {
      inHouseServices: response.data?.inHouseServices || [],
      externalServices: response.data?.externalServices || [],
    }
  } catch (error) {
    console.error("Error fetching dashboard services:", error)
    throw error
  }
}
