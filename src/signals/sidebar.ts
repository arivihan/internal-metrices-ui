import { signal } from '@preact/signals-react'
import type { SidebarConfig } from '../types/sidebar'
import { fetchSidebarData } from '../services/sidebar'

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
 * Get drawer items from sidebar data
 */
export const getDrawerItems = () => {
  return sidebarData.value?.drawerItems ?? []
}

/**
 * Get drawer item by title
 */
export const getDrawerItemByTitle = (title: string) => {
  return sidebarData.value?.drawerItems.find(item => item.title === title)
}