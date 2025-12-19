export interface ApiResponse<T = null> {
  success: boolean | null
  message: string
  status: number
  data: T
  admin: boolean
}

export interface AuthTokenData {
  accessToken: string
  tokenType: string
}

export interface RoleDto {
  roleName: string
}

export interface User {
  userId: string
  username: string
  email: string
  firstname: string
  lastname: string
  phoneNumber: number
  parentNumber: number | null
  disabled: boolean
  role: string[]
  actions: string[]
  roleDto: RoleDto
  roleName: string | null
  createdon: string | null
  edit: boolean
}

// Computed user display data for UI components
export interface UserDisplay {
  name: string
  email: string
  avatar: string
  roles: string[]
}

export interface SendOtpRequest {
  phoneNumber: string
}

export interface VerifyOtpRequest {
  phoneNumber: string
  otp: string
}

export type SendOtpResponse = ApiResponse<null>
export type VerifyOtpResponse = ApiResponse<AuthTokenData>

// /me endpoint returns User directly, not wrapped in ApiResponse
export type MeResponse = User
