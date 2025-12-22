// Types for dashboard select API
export interface DashboardService {
  name: string
  url: string
  iconUrl: string
  accessibleToRoles: string[]
}

export interface DashboardServicesResponse {
  inHouseServices: DashboardService[]
  externalServices: DashboardService[]
}

// Use environment variable for API URL, fallback to mock
const DASHBOARD_SERVICES_API_URL =
  import.meta.env.VITE_DASHBOARD_SERVICES_API_URL ||
  "https://63580e52-8ff3-408f-88fe-80266a4b946c.mock.pstmn.io/dashboard-services"

/**
 * Fetch dashboard services (in-house and external) from the API
 */
export const fetchDashboardServices = async (): Promise<DashboardServicesResponse> => {
  try {
    const response = await fetch(DASHBOARD_SERVICES_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: DashboardServicesResponse = await response.json()
    return {
      inHouseServices: data.inHouseServices || [],
      externalServices: data.externalServices || [],
    }
  } catch (error) {
    console.error("Error fetching dashboard services:", error)
    throw error
  }
}
