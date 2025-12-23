import { apiClient } from './apiClient'
import type {
  SavedQueriesResponse,
  QueryListFilters,
  QueryParams,
  QueryResultRow,
} from '@/types/sqlPlayground'

/**
 * Fetch all saved SQL queries with pagination
 */
export const fetchSavedQueries = async (
  filters: QueryListFilters
): Promise<SavedQueriesResponse> => {
  const params: Record<string, string> = {
    pageNumber: String(filters.pageNumber),
    pageSize: String(filters.pageSize),
  }

  return apiClient<SavedQueriesResponse>('/secure/sql-data-read-query/', {
    params,
  })
}

/**
 * Execute a saved query with parameters
 * Returns raw array of results
 */
export const executeQuery = async (
  queryId: number,
  requestParams: QueryParams
): Promise<QueryResultRow[]> => {
  return apiClient<QueryResultRow[]>(
    '/secure/sql-data-read-query/execute-query',
    {
      method: 'POST',
      params: { queryId: String(queryId) },
      body: JSON.stringify(requestParams),
    }
  )
}
