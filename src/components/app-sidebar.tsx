import * as React from "react";
import { useSignals } from "@preact/signals-react/runtime";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { EnvironmentSwitcher } from "@/components/environment-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/hooks/useSidebar";
import { userDisplay, userLoading } from "@/signals/auth";
import type { DrawerItem } from "@/types/sidebar";

// Dashboard item (top of sidebar)
const dashboardItem: DrawerItem[] = [
  {
    title: "Dashboard",
    type: "getData",
    getDataUrl: "",
    icon: "LayoutDashboard",
    accessibleToRoles: ["ADMIN", "MANAGER"],
  },
];

// Static navigation items (hardcoded, not from API)
const staticNavItems: DrawerItem[] = [
  {
    title: "Users",
    type: "getData",
    getDataUrl: "/users",
    icon: "Users",
    accessibleToRoles: ["ADMIN"],
  },
  {
    title: "Notifications",
    type: "getData",
    getDataUrl: "/notifications",
    icon: "Bell",
    accessibleToRoles: ["ADMIN"],
  },
  {
    title: "ASAT Scorecards",
    type: "getData",
    getDataUrl: "/asat-scorecards",
    icon: "FileCheck",
    accessibleToRoles: ["ADMIN"],
  },
  {
    title: "SQL Playground",
    type: "getData",
    getDataUrl: "/sql-playground",
    icon: "DatabaseZap",
    accessibleToRoles: ["ADMIN"],
  },
  {
    title: "App Configs",
    type: "getData",
    getDataUrl: "/app-configs",
    icon: "Settings",
    accessibleToRoles: ["ADMIN"],
  },
];

function NavUserSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size="lg" className="cursor-default">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="grid flex-1 gap-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  useSignals();
  const { drawerItems, loading, error } = useSidebar();

  const user = userDisplay.value;
  const isUserLoading = userLoading.value || !user;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <EnvironmentSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* Dashboard */}
        <NavMain items={dashboardItem} label="Home" />

        {/* Static navigation items */}
        <NavMain items={staticNavItems} label="Management" />

        {/* Dynamic navigation items from API */}
        {loading && (
          <div className="p-4 text-sm text-muted-foreground">
            Loading sidebar...
          </div>
        )}
        {error && (
          <div className="p-4 text-sm text-destructive">Error: {error}</div>
        )}
        {!loading && !error && drawerItems.length > 0 && (
          <NavMain items={drawerItems} label="Navigation" />
        )}
      </SidebarContent>
      <SidebarFooter>
        {isUserLoading ? <NavUserSkeleton /> : <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
