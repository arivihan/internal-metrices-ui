// Select Option
export interface SelectOption {
  label: string
  value: string
}

// Popup Field
export interface PopupField {
  label: string
  value: string
  type: 'text' | 'select' | 'date'
  placeholder?: string
  selectOptions?: SelectOption[]
}

// Action
export interface Action {
  title: string
  type: 'popup' | 'link'
  actionUrl: string
  accessibleToRoles?: string[]
  showConfirmationPopup?: boolean
  popupFields?: PopupField[]
  popupTitle?: string
  popupSubmitText?: string
  popupSubmitUrl?: string
}

// Table Header
export interface TableHeader {
  Header: string
  accessor: string
  type: 'link' | 'image' | 'text' | 'actions'
  order?: number
  actions?: Action[]
}

// Search Field
export interface SearchField {
  label: string
  value: string
  type: 'text' | 'select'
  placeholder?: string
  selectOptions?: SelectOption[]
}

// Search
export interface Search {
  fields: SearchField[]
  searchBtnText: string
  searchActionUrl: string
}

// Button
export interface Button {
  title: string
  type: 'text' | 'iconButton' | 'icon' | 'SHOW_POPUP'
  icon?: string
  action?: 'showpopup' | 'download' | 'link'
  actionUrl?: string
  accessibleToRoles?: string[]
  popupFields?: PopupField[]
  popupTitle?: string
  popupSubmitText?: string
  popupSubmitUrl?: string
  method?: string
  popupSubtitle?: string
  headers?: Array<{
    name: string
    value?: string
    field?: string
    payloadField?: string
  }>
}

// Tab Item
export interface TabItem {
  tabId: string
  tabTitle: string
  icon?: string
  tableHeaders: TableHeader[]
  search?: Search
  buttons?: Button[]
  getDataUrl: string
  searchable?: boolean
}

// Sub Menu Item
export interface SubMenuItem {
  title: string
  type?: 'GET_DATA' | 'GET_LAYOUT_DATA' | 'getData' | 'getLayout'
  getDataUrl?: string
  getLayoutDataUrl?: string
  tableHeaders?: TableHeader[]
  buttons?: Button[]
  actions?: Action[]
  searchable?: boolean
  search?: Search
  accessibleToRoles?: string[]
}

// Drawer Item
export interface DrawerItem {
  title: string
  type: 'dropdown' | 'getData' | 'getLayout' | 'DROP_DOWN_MENU' | 'GET_DATA' | 'GET_LAYOUT_DATA' | 'TABS'
  getDataUrl?: string
  getLayoutDataUrl?: string
  icon?: string
  accessibleToRoles?: string[]
  tableHeaders?: TableHeader[]
  buttons?: Button[]
  dropdownMenu?: Action[]
  searchable?: boolean
  search?: Search
  subMenuItems?: SubMenuItem[]
  section?: string
  sectionOrder?: number
  tabs?: TabItem[]
}

// Sidebar Config
export interface SidebarConfig {
  drawerItems: DrawerItem[]
}
