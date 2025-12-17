import { apiClient } from './apiClient'
import type {
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@/types/auth'

export const authService = {
  sendOtp: (data: SendOtpRequest): Promise<SendOtpResponse> => {
    return apiClient<SendOtpResponse>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  verifyOtp: (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
    return apiClient<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}
