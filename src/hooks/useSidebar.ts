import { useEffect } from 'react'
import { useSignals } from '@preact/signals-react/runtime'
import {
  sidebarData,
  sidebarLoading,
  sidebarError,
  loadSidebarData,
  refreshSidebarData,
  getDrawerItems,
  getDrawerItemByTitle,
} from '@/signals/sidebar'

/**
 * Custom hook to use sidebar data with Preact signals
 * @param autoLoad - Automatically load sidebar data on mount (default: true)
 */
export const useSidebar = (autoLoad = true) => {
  useSignals()

  useEffect(() => {
    if (autoLoad && !sidebarData.value && !sidebarLoading.value) {
      loadSidebarData()
    }
  }, [autoLoad])

  return {
    data: sidebarData.value,
    loading: sidebarLoading.value,
    error: sidebarError.value,
    refresh: refreshSidebarData,
    drawerItems: getDrawerItems(),
    getItemByTitle: getDrawerItemByTitle,
  }
}
