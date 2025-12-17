import * as React from "react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { EnvironmentSwitcher } from "@/components/environment-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import type { SidebarItem } from "@/types/sidebar"

// Sample navigation config - will be replaced with data from backend API
const sampleNavItems: SidebarItem[] = [
  {
    title: "Dashboard",
    type: "link",
    getDataUrl: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    title: "Lectures",
    type: "dropdown",
    getDataUrl: "/lectures",
    icon: "BookOpen",
    accessibleToRoles: ["ADMIN", "MANAGER"],
    subMenuItems: [
      {
        title: "All Lectures",
        getDataUrl: "/lectures/list",
      },
      {
        title: "Create Lecture",
        getDataUrl: "/lectures/create",
      },
    ],
  },
  {
    title: "Users",
    type: "dropdown",
    getDataUrl: "/users",
    icon: "Users",
    accessibleToRoles: ["ADMIN"],
    subMenuItems: [
      {
        title: "All Users",
        getDataUrl: "/users/list",
      },
      {
        title: "Roles",
        getDataUrl: "/users/roles",
      },
    ],
  },
  {
    title: "Analytics",
    type: "link",
    getDataUrl: "/analytics",
    icon: "BarChart",
  },
  {
    title: "Settings",
    type: "link",
    getDataUrl: "/settings",
    icon: "Settings",
  },
]

// Placeholder user - will be replaced with actual user data from API
const user = {
  name: "User",
  email: "user@arivihan.com",
  avatar: "/arivihan.jpeg",
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // TODO: Fetch navigation config from backend API
  // TODO: Filter items based on user roles (accessibleToRoles)
  const navItems = sampleNavItems

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <EnvironmentSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} label="Navigation" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
