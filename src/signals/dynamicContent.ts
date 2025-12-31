import { signal } from '@preact/signals-react'
import type { DrawerItem, SubMenuItem, Button } from '@/types/sidebar'
import { fetchDataByUrl } from '@/services/sidebar'

// Dynamic content states
export const currentContentItem = signal<DrawerItem | SubMenuItem | null>(null)
export const popupOpen = signal<boolean>(false)
export const currentPopupButton = signal<Button | null>(null)

// Layout data states
export const layoutData = signal<Record<string, any> | null>(null)
export const layoutLoading = signal<boolean>(false)
export const layoutError = signal<string | null>(null)

// Table data states
export const tableData = signal<any[]>([])
export const tableDataLoading = signal<boolean>(false)
export const tableDataError = signal<string | null>(null)

// Pagination states
export const pagination = signal<{
  currentPage: number
  pageSize: number
  totalPages: number
  totalElements: number
}>({ currentPage: 0, pageSize: 10, totalPages: 0, totalElements: 0 })

// Open popup
export const openPopup = (button: Button) => {
  currentPopupButton.value = button
  popupOpen.value = true
}

// Normalize different API response formats into array
const extractArrayData = (response: any): any[] => {
  if (!response) return []

  // Direct array
  if (Array.isArray(response)) return response

  // Standard REST
  if (Array.isArray(response.data)) return response.data

  // Spring / Java pagination
  if (Array.isArray(response.content)) return response.content


  if (Array.isArray(response.contents)) return response.contents

  // Body as array
  if (Array.isArray(response.body)) return response.body

  // Body → content
  if (Array.isArray(response.body?.content)) {
    return response.body.content
  }

  // Body → data
  if (Array.isArray(response.body?.data)) {
    return response.body.data
  }

  console.warn("⚠️ Unknown API response format:", response)
  return []
}

// Extract pagination info from API response (Spring Boot Page format)
const extractPaginationInfo = (response: any): any => {
  // Spring Boot Page format
  if (response?.pageable || response?.totalPages !== undefined) {
    return {
      currentPage: response.number ?? response.pageNumber ?? 0,
      pageSize: response.size ?? response.pageSize ?? 10,
      totalPages: response.totalPages ?? 1,
      totalElements: response.totalElements ?? 0,
    }
  }

  // Standard pagination wrapper
  if (response?.pagination) {
    return {
      currentPage: response.pagination.currentPage ?? 0,
      pageSize: response.pagination.pageSize ?? 10,
      totalPages: response.pagination.totalPages ?? 1,
      totalElements: response.pagination.totalElements ?? 0,
    }
  }

  // Default fallback
  return { currentPage: 0, pageSize: 10, totalPages: 1, totalElements: 0 }
}

// Close popup
export const closePopup = () => {
  popupOpen.value = false
  currentPopupButton.value = null
}

// Set current content item
export const setCurrentContentItem = (item: DrawerItem | SubMenuItem | null) => {
  currentContentItem.value = item
}

// Fetch table data from URL (handles both absolute and relative URLs)
export const fetchTableData = async (url: string, pageNo: number = 0, pageSize: number = 10) => {
  try {
    tableDataLoading.value = true;
    tableDataError.value = null;

    console.log(`[fetchTableData] 📡 Fetching from: ${url}`);
    
    // Add pagination params to URL
    const urlObj = new URL(url, window.location.origin);
    urlObj.searchParams.set('level', 'SYSTEM');
    urlObj.searchParams.set('pageNo', String(pageNo));
    urlObj.searchParams.set('pageSize', String(pageSize));
    
    const finalUrl = urlObj.toString().replace(window.location.origin, '');
    console.log(`[fetchTableData] 📡 Final URL with params: ${finalUrl}`);
    
    const response = await fetchDataByUrl(finalUrl);
    
    // Handle wrapped API response
    let responseData = response;
    if (response?.data && typeof response.data === 'object') {
      responseData = response.data;
    }

    const data = extractArrayData(responseData);
    const paginationInfo = extractPaginationInfo(responseData);

    tableData.value = data;
    pagination.value = paginationInfo;
    console.log(`[fetchTableData] 📊 Table data set to:`, data);
    console.log(`[fetchTableData] 📄 Pagination info:`, paginationInfo);
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : "Failed to fetch table data";
    console.error(`[fetchTableData] ❌ Error:`, errorMsg);

    tableDataError.value = errorMsg;
    tableData.value = [];
  } finally {
    tableDataLoading.value = false;
  }
};

// Update table data directly (used after form submission)
export const updateTableData = (newData: any[]) => {
  tableData.value = newData
  console.log(`[updateTableData] 📊 Table data updated:`, newData)
}


// Fetch layout data from URL (and then fetch table data if getDataUrl is provided)
export const fetchLayoutData = async (url: string) => {
  try {
    layoutLoading.value = true
    layoutError.value = null
    console.log(`[fetchLayoutData] 📡 Starting fetch from: ${url}`)
    const response = await fetchDataByUrl(url)
    
    console.log(`[fetchLayoutData] 📦 Raw response:`, response)
    
    // Handle wrapped API response (with code, message, success, data, etc.)
    let layoutContent = response;
    
    // Check if response has standard wrapper structure (code, message, success, data)
    if (response?.code && response?.data && typeof response.data === 'object') {
      // Extract data from wrapper
      layoutContent = response.data;
      console.log(`[fetchLayoutData] 🔄 Extracting from wrapped response.data`);
    }
    
    // Check if data has uiJson with tabs (old TABS format)
    if (layoutContent?.uiJson && layoutContent?.uiJson?.tabs) {
      console.log(`[fetchLayoutData] 🔄 Extracting from uiJson (old TABS format)`);
      layoutContent = layoutContent.uiJson;
    }
    
    // Ensure we have type property for TABS layout
    if (layoutContent?.tabs && !layoutContent?.type) {
      console.log(`[fetchLayoutData] ✏️ Adding type: TABS to layout`);
      layoutContent = { ...layoutContent, type: "TABS" };
    }
    
    console.log(`[fetchLayoutData] ✅ Received layout data:`, layoutContent)
    layoutData.value = layoutContent
    layoutError.value = null
    
    // If the layout response includes a getDataUrl, fetch the table data
    if (layoutContent?.getDataUrl) {
      console.log(`[fetchLayoutData] Found getDataUrl in response: ${layoutContent.getDataUrl}, fetching table data`);
      await fetchTableData(layoutContent.getDataUrl, 0, 10); // Pass initial page params
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to fetch layout data'
    console.error(`[fetchLayoutData] ❌ Error:`, errorMsg)
    layoutError.value = errorMsg
    layoutData.value = null
  } finally {
    layoutLoading.value = false
  }
}
