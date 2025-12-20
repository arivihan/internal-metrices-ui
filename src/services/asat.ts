import { apiClient } from './apiClient'
import type {
  ASATStatus,
  ASATPaginatedResponse,
  ASATUpdateParams,
} from '@/types/asat'

export interface ASATFilters {
  scoreCardStatus: ASATStatus
  page?: number
  size?: number
  searchText?: string
}

/**
 * Fetch ASAT scorecards with pagination and filtering
 */
export const fetchASATScorecards = async (
  filters: ASATFilters
): Promise<ASATPaginatedResponse> => {
  const params: Record<string, string> = {
    scoreCardStatus: filters.scoreCardStatus,
    page: String(filters.page ?? 0),
    size: String(filters.size ?? 10),
  }

  if (filters.searchText !== undefined) {
    params.searchText = filters.searchText
  }

  return apiClient<ASATPaginatedResponse>('/secure/asat', { params })
}

/**
 * Update ASAT scorecard status
 */
export const updateASATStatus = async (
  params: ASATUpdateParams
): Promise<void> => {
  const queryParams: Record<string, string> = {
    userId: params.userId,
    status: params.status,
    id: params.id,
    rejectionRemarks: params.rejectionRemarks ?? 'null',
  }

  return apiClient('/secure/asat/update', { params: queryParams })
}

/**
 * Download all ASAT info as CSV
 */
export const downloadASATInfo = async (
  status: ASATStatus,
  searchText?: string
): Promise<Blob> => {
  const params: Record<string, string> = {
    status,
    searchText: searchText ?? '',
  }

  const queryString = new URLSearchParams(params).toString()
  const url = `/api/secure/asat/download-all-approved?${queryString}`

  const response = await fetch(url, {
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error('Failed to download ASAT info')
  }

  return response.blob()
}
