import { apiClient } from './apiClient'
import type { SidebarConfig, DrawerItem, SubMenuItem } from '../types/sidebar'

/**
 * Transform API response to match DrawerItem type
 */
const transformDrawerItem = (item: any): DrawerItem => {
  return {
    title: item.title,
    type: item.type === 'DROP_DOWN_MENU' ? 'dropdown' : (item.getLayoutDataUrl ? 'getLayout' : 'getData'),
    getDataUrl: item.getDataUrl || '',
    getLayoutDataUrl: item.getLayoutDataUrl || '',
    icon: item.icon,
    accessibleToRoles: item.accessibleToRoles,
    tableHeaders: item.tableHeaders,
    buttons: item.buttons,
    dropdownMenu: item.dropdownMenu,
    searchable: item.searchable,
    search: item.search,
    subMenuItems: item.subMenuItems?.map(transformSubMenuItem) || [],
  }
}

const transformSubMenuItem = (item: any): SubMenuItem => {
  return {
    title: item.title,
    getDataUrl: item.getLayoutDataUrl || item.getDataUrl || '',
    tableHeaders: item.tableHeaders,
    buttons: item.buttons,
    actions: item.actions,
    searchable: item.searchable,
    search: item.search,
  }
}

/**
 * Fetch sidebar configuration data from the API
 */
export const fetchSidebarData = async (): Promise<SidebarConfig> => {
  const sidebarApiUrl = import.meta.env.VITE_SIDEBAR_API_URL || '/secure/ui/fetch-component-configs/drawer-items'
  const response = await apiClient<{
    code: string
    message: null
    success: boolean
    data: {
      drawerItems: any[]
    }
    size: null
    page: null
  }>(sidebarApiUrl)
  
  return {
    drawerItems: response.data.drawerItems.map(transformDrawerItem),
  }
}

/**
 * Fetch data from any endpoint (for table data, etc.)
 * Uses apiClient for proper auth, headers, and proxy handling
 */
export const fetchDataByUrl = async <T = any>(url: string): Promise<T> => {
  try {
    console.log(`[fetchDataByUrl] Fetching from: ${url}`);
    
    // Handle different URL formats
    if (url.startsWith('http')) {
      // Absolute URL - fetch directly
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    } else {
      // Relative URL - let apiClient handle it (it will prepend /api)
      const data = await apiClient<T>(url);
      console.log(`[fetchDataByUrl] Success:`, data);
      return data;
    }
  } catch (error) {
    console.error(`[fetchDataByUrl] Error fetching data from ${url}:`, error);
    throw error;
  }
}

/**
 * Submit form data to an endpoint
 */
export const submitFormData = async <T = any>(url: string, data: any): Promise<T> => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  } catch (error) {
    console.error(`Error submitting data to ${url}:`, error)
    throw error
  }
}