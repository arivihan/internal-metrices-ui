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

export interface User {
  id: string
  name: string
  email: string
  phoneNumber: string
  role: string
  avatar?: string
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
export type UserResponse = ApiResponse<User>
