import type { DashboardUiConfig, DashboardUiConfigResponse } from "@/types/dashboardUiConfig"
import { apiClient } from "./apiClient"


export interface AppConfigFilters {
  configName: string
  pageNumber?: number
  pageSize?: number
}

export const fetchDashboardUIConfigs = async (
  filters: AppConfigFilters
): Promise<DashboardUiConfigResponse> => {
  const params: Record<string, string> = {
    appConfigType: filters.configName,
    pageNumber: String(filters.pageNumber ?? 0),
    pageSize: String(filters.pageSize ?? 10),
  }

  return apiClient<DashboardUiConfigResponse>('/secure/ui/get-paginated-config?', { params })
}


export const saveDashboardUIConfig = async (
  payload: DashboardUiConfig
): Promise<DashboardUiConfigResponse> => {
  return apiClient<DashboardUiConfigResponse>('/secure/ui/save-ui-screen-config', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

