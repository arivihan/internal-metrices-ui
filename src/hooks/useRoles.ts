import { useState, useEffect, useCallback } from 'react'
import { fetchRoles, type RoleFilters } from '@/services/roles'
import type { Role } from '@/types/rbac'

interface UseRolesResult {
  roles: Role[]
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
 * Custom hook to fetch and manage roles data with pagination
 */
export const useRoles = (initialFilters: RoleFilters = {}): UseRolesResult => {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageNumber, setPageNumber] = useState(initialFilters.page ?? 0)
  const [pageSize] = useState(initialFilters.size ?? 10)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLastPage, setIsLastPage] = useState(false)

  const loadRoles = useCallback(async (page: number) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetchRoles({ page, size: pageSize })
      setRoles(response.content)
      setPageNumber(response.pageNumber)
      setTotalElements(response.totalElements)
      setTotalPages(response.totalPages)
      setIsLastPage(response.last)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles'
      setError(errorMessage)
      console.error('[useRoles] Error fetching roles:', err)
    } finally {
      setLoading(false)
    }
  }, [pageSize])

  const refresh = useCallback(async () => {
    await loadRoles(pageNumber)
  }, [loadRoles, pageNumber])

  const loadPage = useCallback(async (page: number) => {
    setPageNumber(page)
    await loadRoles(page)
  }, [loadRoles])

  // Load roles on mount
  useEffect(() => {
    loadRoles(pageNumber)
  }, []) // Only run on mount

  return {
    roles,
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
