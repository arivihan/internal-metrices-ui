import { useSignals } from '@preact/signals-react/runtime'
import { userRoles } from '@/signals/auth'

/**
 * Hook for role-based access control
 * Provides utilities to check user roles and filter items by access
 */
export const useRole = () => {
  useSignals()

  const roles = userRoles.value

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: string): boolean => {
    return roles.includes(role)
  }

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRole = (requiredRoles: string[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true
    return requiredRoles.some((role) => roles.includes(role))
  }

  /**
   * Check if user has all of the specified roles
   */
  const hasAllRoles = (requiredRoles: string[]): boolean => {
    if (!requiredRoles || requiredRoles.length === 0) return true
    return requiredRoles.every((role) => roles.includes(role))
  }

  /**
   * Check if user can access an item based on its accessibleToRoles
   * Returns true if:
   * - accessibleToRoles is undefined/null/empty (no restriction)
   * - user has at least one of the required roles
   */
  const canAccess = (accessibleToRoles?: string[]): boolean => {
    if (!accessibleToRoles || accessibleToRoles.length === 0) return true
    return hasAnyRole(accessibleToRoles)
  }

  /**
   * Filter an array of items based on accessibleToRoles
   */
  const filterByRole = <T extends { accessibleToRoles?: string[] }>(
    items: T[]
  ): T[] => {
    return items.filter((item) => canAccess(item.accessibleToRoles))
  }

  return {
    roles,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    canAccess,
    filterByRole,
  }
}

// Standalone utility functions (for use outside React components)
export const checkHasRole = (userRolesList: string[], role: string): boolean => {
  return userRolesList.includes(role)
}

export const checkHasAnyRole = (
  userRolesList: string[],
  requiredRoles: string[]
): boolean => {
  if (!requiredRoles || requiredRoles.length === 0) return true
  return requiredRoles.some((role) => userRolesList.includes(role))
}

export const checkCanAccess = (
  userRolesList: string[],
  accessibleToRoles?: string[]
): boolean => {
  if (!accessibleToRoles || accessibleToRoles.length === 0) return true
  return checkHasAnyRole(userRolesList, accessibleToRoles)
}

export const filterItemsByRole = <T extends { accessibleToRoles?: string[] }>(
  items: T[],
  userRolesList: string[]
): T[] => {
  return items.filter((item) => checkCanAccess(userRolesList, item.accessibleToRoles))
}
