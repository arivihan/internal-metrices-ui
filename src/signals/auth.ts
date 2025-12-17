import { signal, computed } from '@preact/signals-react'

const getStoredToken = (): string | null => {
  try {
    return localStorage.getItem('accessToken')
  } catch {
    return null
  }
}

const getStoredAdmin = (): boolean => {
  try {
    return localStorage.getItem('isAdmin') === 'true'
  } catch {
    return false
  }
}

// Auth signals
export const accessToken = signal<string | null>(getStoredToken())
export const isAdmin = signal<boolean>(getStoredAdmin())

// Computed signals
export const isAuthenticated = computed(() => !!accessToken.value)

// Auth actions
export const setAuth = (token: string, admin: boolean) => {
  accessToken.value = token
  isAdmin.value = admin
  localStorage.setItem('accessToken', token)
  localStorage.setItem('isAdmin', String(admin))
}

export const clearAuth = () => {
  accessToken.value = null
  isAdmin.value = false
  localStorage.removeItem('accessToken')
  localStorage.removeItem('isAdmin')
}
