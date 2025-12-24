import { apiClient } from './apiClient'
import type { AppConfigType, AppConfigPaginatedResponse } from '@/types/appConfig'

export interface AppConfigFilters {
  appConfigType: AppConfigType
  pageNumber?: number
  pageSize?: number
}

export interface AppConfigSearchFilters {
  appConfig: AppConfigType
  searchText: string
  pageNumber?: number
  pageSize?: number
}

/**
 * Fetch app configs with pagination
 */
export const fetchAppConfigs = async (
  filters: AppConfigFilters
): Promise<AppConfigPaginatedResponse> => {
  const params: Record<string, string> = {
    appConfigType: filters.appConfigType,
    pageNumber: String(filters.pageNumber ?? 0),
    pageSize: String(filters.pageSize ?? 10),
  }

  return apiClient<AppConfigPaginatedResponse>('/secure/app-config/all-configs', { params })
}

/**
 * Search app configs with pagination
 */
export const searchAppConfigs = async (
  filters: AppConfigSearchFilters
): Promise<AppConfigPaginatedResponse> => {
  const params: Record<string, string> = {
    appConfig: filters.appConfig,
    searchText: filters.searchText,
    pageNumber: String(filters.pageNumber ?? 0),
    pageSize: String(filters.pageSize ?? 10),
  }

  return apiClient<AppConfigPaginatedResponse>('/secure/app-config/search-config', { params })
}

export interface AddConfigPayload {
  appConfigType: AppConfigType
  configKey: string
  configValue: Record<string, unknown>
}

export interface AddConfigResponse {
  code: string
  message: string
  success: boolean
  data: null
}

/**
 * Add a new app config
 */
export const addAppConfig = async (payload: AddConfigPayload): Promise<AddConfigResponse> => {
  return apiClient<AddConfigResponse>('/secure/app-config/add-new-config', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
