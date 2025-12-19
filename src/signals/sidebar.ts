import { signal } from '@preact/signals-react'
import type { SidebarConfig } from '../types/sidebar'
import { fetchSidebarData } from '../services/sidebar'
import { userRoles } from './auth'
import { filterItemsByRole } from '../hooks/useRole'

// Sidebar state signals
export const sidebarData = signal<SidebarConfig | null>(null)
export const sidebarLoading = signal<boolean>(false)
export const sidebarError = signal<string | null>(null)

/**
 * Load sidebar data from API
 */
export const loadSidebarData = async () => {
  try {
    sidebarLoading.value = true
    sidebarError.value = null
    
    const data = await fetchSidebarData()
    sidebarData.value = data
  } catch (error) {
    sidebarError.value = error instanceof Error ? error.message : 'Failed to load sidebar data'
    console.error('Error loading sidebar data:', error)
  } finally {
    sidebarLoading.value = false
  }
}

/**
 * Refresh sidebar data
 */
export const refreshSidebarData = async () => {
  await loadSidebarData()
}

/**
 * Reset sidebar state
 */
export const resetSidebarState = () => {
  sidebarData.value = null
  sidebarLoading.value = false
  sidebarError.value = null
}

/**
 * Get drawer items from sidebar data (unfiltered)
 */
export const getDrawerItems = () => {
  return sidebarData.value?.drawerItems ?? []
}

/**
 * Get drawer items filtered by user's roles
 */
export const getFilteredDrawerItems = () => {
  const items = sidebarData.value?.drawerItems ?? []
  const roles = userRoles.value
  return filterItemsByRole(items, roles)
}

/**
 * Get drawer item by title
 */
export const getDrawerItemByTitle = (title: string) => {
  return sidebarData.value?.drawerItems.find(item => item.title === title)
}