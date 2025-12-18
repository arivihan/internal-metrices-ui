import { useEffect } from 'react'
import { accessToken, currentUser, userLoading, setUser, clearAuth } from '@/signals/auth'
import { authService } from '@/services/auth'

/**
 * Hook to initialize auth state on app load.
 * If a token exists but user data is not loaded, fetches user data.
 * Should be called once at the app root level.
 */
export const useAuthInit = () => {
  useEffect(() => {
    const initAuth = async () => {
      // If we have a token but no user data, fetch it
      if (accessToken.value && !currentUser.value) {
        userLoading.value = true
        try {
          const user = await authService.getMe(accessToken.value)
          setUser(user)
        } catch (error) {
          // Token is invalid or expired, clear auth
          console.error('Failed to fetch user data:', error)
          clearAuth()
        } finally {
          userLoading.value = false
        }
      }
    }

    initAuth()
  }, [])
}
