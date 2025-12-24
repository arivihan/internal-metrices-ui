// App Config types
export type AppConfigType = 'SQL_CONFIG' | 'DYNAMODB_CONFIG' | 'FIREBASE_CONFIG'

// SQL Config item (name/value structure)
export interface SqlConfigItem {
  name: string
  value: string
}

// DynamoDB Config item (featureKey/keyValues/objectValues structure)
export interface DynamoDbConfigItem {
  featureKey: string
  keyValues?: Record<string, string>
  objectValues?: Record<string, unknown>
}

// Paginated content for DynamoDB/Firebase
export interface DynamoDbPaginatedContent {
  content: DynamoDbConfigItem[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// SQL Config paginated response
export interface SqlConfigPaginatedResponse {
  code: string
  message: string | null
  success: boolean
  data: SqlConfigItem[]
  size: number
  page: number
  totalElements: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// DynamoDB/Firebase Config paginated response
export interface DynamoDbConfigPaginatedResponse {
  code: string
  message: string | null
  success: boolean
  data: DynamoDbPaginatedContent
  size: number
  page: number
  totalElements: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

// Union type for all config responses
export type AppConfigPaginatedResponse = SqlConfigPaginatedResponse | DynamoDbConfigPaginatedResponse

// Type guard to check if response is SQL config
export function isSqlConfigResponse(
  response: AppConfigPaginatedResponse
): response is SqlConfigPaginatedResponse {
  return Array.isArray(response.data)
}

// Type guard to check if response is DynamoDB/Firebase config
export function isDynamoDbConfigResponse(
  response: AppConfigPaginatedResponse
): response is DynamoDbConfigPaginatedResponse {
  return !Array.isArray(response.data) && 'content' in response.data
}
