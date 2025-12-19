import { signal, computed } from '@preact/signals-react'
import type { User, UserDisplay } from '@/types/auth'

// Cookie utilities
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`
}

const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? match[2] : null
}

const deleteCookie = (name: string) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

const getStoredToken = (): string | null => {
  try {
    // Try cookie first, then localStorage for backwards compatibility
    return getCookie('avToken') || localStorage.getItem('accessToken')
  } catch {
    return null
  }
}

// Auth signals
export const accessToken = signal<string | null>(getStoredToken())
export const currentUser = signal<User | null>(null)
export const userLoading = signal<boolean>(false)

// Computed signals
export const isAuthenticated = computed(() => !!accessToken.value)

export const isAdmin = computed(() => {
  if (!currentUser.value) return false
  return currentUser.value.role.includes('ADMIN')
})

export const userRoles = computed(() => {
  if (!currentUser.value) return []
  return currentUser.value.role
})

// Computed display data for UI components
export const userDisplay = computed<UserDisplay | null>(() => {
  if (!currentUser.value) return null
  const user = currentUser.value
  return {
    name: `${user.firstname} ${user.lastname}`.trim() || user.username,
    email: user.email,
    avatar: '', // No avatar in API response, will use fallback
    roles: user.role,
  }
})

// Auth actions
export const setAuth = (token: string) => {
  accessToken.value = token
  // Set token as cookie (required by backend)
  setCookie('avToken', token, 7)
  // Also keep in localStorage for backwards compatibility
  localStorage.setItem('accessToken', token)
}

export const setUser = (user: User) => {
  currentUser.value = user
  // Set role cookie (required by backend)
  if (user.role.length > 0) {
    setCookie('role', user.role[0].toLowerCase(), 7)
  }
}

export const clearAuth = () => {
  accessToken.value = null
  currentUser.value = null
  deleteCookie('avToken')
  deleteCookie('role')
  localStorage.removeItem('accessToken')
}
