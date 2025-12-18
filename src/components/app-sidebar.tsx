import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { EnvironmentSwitcher } from "@/components/environment-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/useSidebar";

// Placeholder user - will be replaced with actual user data from API
const user = {
  name: "User",
  email: "user@arivihan.com",
  avatar: "/arivihan.jpeg",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { drawerItems, loading, error } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <EnvironmentSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {loading && (
          <div className="p-4 text-sm text-muted-foreground">
            Loading sidebar...
          </div>
        )}
        {error && (
          <div className="p-4 text-sm text-destructive">Error: {error}</div>
        )}
        {!loading && !error && (
          <NavMain items={drawerItems} label="Navigation" />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
