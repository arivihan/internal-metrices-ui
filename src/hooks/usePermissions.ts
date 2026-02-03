import { useState, useEffect, useCallback } from 'react'
import { fetchPermissions, type PermissionFilters } from '@/services/permissions'
import type { RolePermission } from '@/types/rbac'

interface UsePermissionsResult {
  permissions: RolePermission[]
  loading: boolean
  error: string | null
  pageNumber: number
  pageSize: number
  totalElements: number
  totalPages: number
  isLastPage: boolean
  refresh: () => Promise<void>
  loadPage: (page: number) => Promise<void>
}

/**
 * Custom hook to fetch and manage permissions data with pagination
 */
export const usePermissions = (initialFilters: PermissionFilters = {}): UsePermissionsResult => {
  const [permissions, setPermissions] = useState<RolePermission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(initialFilters.page ?? 0)
  const [pageSize] = useState(initialFilters.size ?? 10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)

  const loadPermissions = useCallback(async (page: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchPermissions({
        page,
        size: pageSize,
        sortBy: 'createdAt',
        sortDir: 'DESC'
      })
      setPermissions(response.content)
      setPageNumber(response.pageNumber)
      setTotalElements(response.totalElements)
      setTotalPages(response.totalPages)
      setIsLastPage(response.last)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch permissions'
      setError(errorMessage)
      console.error('[usePermissions] Error fetching permissions:', err)
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  const refresh = useCallback(async () => {
    await loadPermissions(pageNumber)
  }, [loadPermissions, pageNumber])

  const loadPage = useCallback(async (page: number) => {
    setPageNumber(page)
    await loadPermissions(page)
  }, [loadPermissions])

  // Load permissions on mount
  useEffect(() => {
    loadPermissions(pageNumber)
  }, []) // Only run on mount

  return {
    permissions,
    loading,
    error,
    pageNumber,
    pageSize,
    totalElements,
    totalPages,
    isLastPage,
    refresh,
    loadPage,
  }
}
