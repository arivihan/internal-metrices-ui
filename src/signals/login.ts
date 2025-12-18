import { signal } from '@preact/signals-react'

// Login flow states
export const loginStep = signal<'phone' | 'otp'>('phone')
export const phoneNumber = signal<string>('')
export const otp = signal<string>('')
export const loginLoading = signal<boolean>(false)
export const loginError = signal<string | null>(null)

// Reset login state
export const resetLoginState = () => {
  loginStep.value = 'phone'
  phoneNumber.value = ''
  otp.value = ''
  loginLoading.value = false
  loginError.value = null
}

// Set login error
export const setLoginError = (error: string | null) => {
  loginError.value = error
}

// Go to OTP step
export const goToOtpStep = () => {
  loginStep.value = 'otp'
  loginError.value = null
}

// Go back to phone step
export const goToPhoneStep = () => {
  loginStep.value = 'phone'
  otp.value = ''
  loginError.value = null
}
