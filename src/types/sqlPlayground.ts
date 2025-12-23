// Param schema - maps param name to type
export type ParamType = 'date' | 'text' | 'number' | string

export type ParamSchema = Record<string, ParamType>

// Saved query item from GET /secure/sql-data-read-query/
export interface SavedQuery {
  id: number
  name: string
  description: string
  sqlQuery: string
  paramSchema: ParamSchema
  isActive: boolean
  createdAt: string
  updatedAt: string
}

// API response wrapper for list endpoint
export interface SavedQueriesResponse {
  code: string
  message: string | null
  success: boolean
  data: SavedQuery[]
  size: number | null
  page: number | null
}

// Query execution params - dynamic based on paramSchema
export type QueryParams = Record<string, string>

// Query result - dynamic columns based on the query
export type QueryResultRow = Record<string, unknown>

// API response for query execution
export interface QueryExecutionResponse {
  code: string
  message: string | null
  success: boolean
  data: QueryResultRow[]
}

// Pagination params for list endpoint
export interface QueryListFilters {
  pageNumber: number
  pageSize: number
}

// Request payload for creating/updating a query
// Include id for updates, omit for new queries
export interface CreateQueryRequest {
  id?: number
  name: string
  description: string
  sqlQuery: string
  paramSchema: ParamSchema
  isActive: boolean
}

// API response for create query
export interface CreateQueryResponse {
  code: string
  message: string | null
  success: boolean
  data: SavedQuery
}
