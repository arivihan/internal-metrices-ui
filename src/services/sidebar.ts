import { apiClient } from './apiClient'
import { API_CONFIG } from '@/config'
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
    section: item.section,
    sectionOrder: item.sectionOrder,
  }
}

const transformSubMenuItem = (item: any): SubMenuItem => {
  return {
    title: item.title,
    type: item.type,
    getDataUrl: item.getLayoutDataUrl || item.getDataUrl || '',
    getLayoutDataUrl: item.getLayoutDataUrl || '',
    tableHeaders: item.tableHeaders,
    buttons: item.buttons,
    actions: item.actions,
    searchable: item.searchable,
    search: item.search,
    accessibleToRoles: item.accessibleToRoles,
  }
}

/**
 * Fetch sidebar configuration data from the API
 */
export const fetchSidebarData = async (): Promise<SidebarConfig> => {
  const sidebarApiUrl = import.meta.env.VITE_SIDEBAR_API_URL || `${API_CONFIG.DOMAIN}/secure/ui/fetch-component-configs/drawer-items`
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
 * Fetch layout configuration for a submenu item from the API
 */
export const fetchSubMenuLayout = async (subMenuItem: SubMenuItem): Promise<any> => {
  if (!subMenuItem.getLayoutDataUrl) {
    throw new Error('No getLayoutDataUrl configured for submenu item')
  }

  try {
    console.log(`[fetchSubMenuLayout] Fetching layout from: ${subMenuItem.getLayoutDataUrl}`)
    const response = await apiClient(subMenuItem.getLayoutDataUrl)
    console.log(`[fetchSubMenuLayout] Success:`, response)
    return response
  } catch (error) {
    console.error(`[fetchSubMenuLayout] Error fetching layout:`, error)
    throw error
  }
}

/**
 * Fetch submenu data from the API
 */
export const fetchSubMenuData = async (url: string): Promise<any> => {
  try {
    console.log(`[fetchSubMenuData] Fetching data from: ${url}`)
    const response = await apiClient(url)
    console.log(`[fetchSubMenuData] Success:`, response)
    return response
  } catch (error) {
    console.error(`[fetchSubMenuData] Error fetching submenu data:`, error)
    throw error
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
      // Relative URL - filter empty query params only
      const urlObj = new URL(url, 'http://localhost');
      const basePath = url.split('?')[0];

      // Filter out empty query parameters
      const params = new URLSearchParams(urlObj.search);
      for (const [key, value] of params.entries()) {
        if (value === '') {
          params.delete(key);
        }
      }

      // Reconstruct the URL without empty params, preserving original path
      const cleanUrl = `${basePath}${params.toString() ? '?' + params.toString() : ''}`;

      console.log(`[fetchDataByUrl] Clean URL: ${url} → ${cleanUrl}`);
      const data = await apiClient<T>(cleanUrl);
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