// App Config types

// SQL Config item (name/value structure)
export interface DashboardUiConfig {
  configName: string;
  uiJson: string | object;
  order: number;
  isActive: boolean;
}



// DynamoDB/Firebase Config paginated response
export interface DashboardUiConfigResponse {
  code: string
  message: string | null
  success: boolean
  data: DashboardUiConfig[]
  size: number
  page: number
  totalElements: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}


