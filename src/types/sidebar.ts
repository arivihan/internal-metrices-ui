export interface SidebarSubMenuItem {
  title: string
  getDataUrl?: string
  icon?: string
  accessibleToRoles?: string[]
}

export interface SidebarItem {
  title: string
  type: 'dropdown' | 'getData' | 'link'
  getDataUrl?: string
  icon?: string
  accessibleToRoles?: string[]
  subMenuItems?: SidebarSubMenuItem[]
}

export interface SidebarConfig {
  drawerItems: SidebarItem[]
}
