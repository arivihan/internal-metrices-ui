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

/* ------------------------------------------------------------------ */
/* Dashboard (top item) - HARDCODED */
/* ------------------------------------------------------------------ */

const dashboardItem: DrawerItem[] = [
  {
    title: "Dashboard",
    type: "getData",
    getDataUrl: "",
    icon: "LayoutDashboard",
    accessibleToRoles: ["ADMIN", "MANAGER"],
  },
];

/* ------------------------------------------------------------------ */
/* Static items per section - HARDCODED */
/* ------------------------------------------------------------------ */

const staticItemsBySection: Record<string, DrawerItem[]> = {
  MANAGEMENT: [
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
  ],
};

/* ------------------------------------------------------------------ */
/* Skeleton */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* App Sidebar */
/* ------------------------------------------------------------------ */

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  useSignals();

  const { drawerItems, loading, error } = useSidebar();
  const user = userDisplay.value;
  const isUserLoading = userLoading.value || !user;

  /**
   * Get all unique sections from drawer items AND static items
   */
  const getSections = React.useCallback((): string[] => {
    const sectionsSet = new Set<string>();

    // Add sections from dynamic drawer items
    if (drawerItems && drawerItems.length > 0) {
      drawerItems.forEach((item) => {
        const section = (item.section ?? "NAVIGATION").toUpperCase();
        sectionsSet.add(section);
      });
    }

    // Add sections from static items
    Object.keys(staticItemsBySection).forEach((section) => {
      sectionsSet.add(section.toUpperCase());
    });

    return Array.from(sectionsSet).sort();
  }, [drawerItems]);

  /**
   * Get static items for a section
   */
  const getStaticItems = React.useCallback((section: string): DrawerItem[] => {
    return staticItemsBySection[section.toUpperCase()] || [];
  }, []);

  /**
   * Section-based filtering for dynamic items
   * - Items without `section` default to NAVIGATION
   * - Backward compatible with old backend JSON
   */
  const getDynamicSectionItems = React.useCallback(
    (section: string): DrawerItem[] => {
      if (!drawerItems || drawerItems.length === 0) return [];

      // Debug: Log the first item to see its structure
      if (drawerItems.length > 0) {
        console.log("Sample drawer item:", drawerItems[0]);
        console.log("Has section?", "section" in drawerItems[0]);
      }

      return drawerItems
        .filter((item) => {
          // normalize section - if no section provided, default to NAVIGATION
          const itemSection = (item.section ?? "NAVIGATION").toUpperCase();
          console.log(itemSection)
          console.log(
            `Item "${item.title}" section: "${itemSection}", comparing with "${section}"`
          );
          return itemSection === section.toUpperCase();
        })
        .sort((a, b) => (a.sectionOrder ?? 0) - (b.sectionOrder ?? 0));
    },
    [drawerItems]
  );

  /**
   * Combine static and dynamic items for a section
   * Static items come first, then dynamic items
   */
  const getCombinedSectionItems = React.useCallback(
    (section: string): DrawerItem[] => {
      const staticItems = getStaticItems(section);
      const dynamicItems = getDynamicSectionItems(section);
      return [...staticItems, ...dynamicItems];
    },
    [getStaticItems, getDynamicSectionItems]
  );

  /**
   * Format section name for display
   * Example: "NAVIGATION" -> "Navigation", "ACADEMY" -> "Academy"
   */
  const formatSectionLabel = (section: string): string => {
    return section.charAt(0).toUpperCase() + section.slice(1).toLowerCase();
  };

  // Get all sections (both static and dynamic)
  const allSections = getSections();

  // Filter sections to separate "MANAGEMENT" from others
  const managementItems = getCombinedSectionItems("MANAGEMENT");
  const otherSections = allSections.filter(
    (section) => section.toUpperCase() !== "MANAGEMENT"
  );

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <EnvironmentSwitcher />
      </SidebarHeader>

      <SidebarContent>
        {/* Home - HARDCODED (TOP) */}
        <NavMain items={dashboardItem} label="Home" />

        {/* Management - STATIC (TOP) */}
        {managementItems.length > 0 && (
          <NavMain items={managementItems} label="Management" />
        )}

        {/* Loading state */}
        {loading && (
          <div className="p-4 text-sm text-muted-foreground">
            Loading sidebar…
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 text-sm text-destructive">
            Error loading sidebar
          </div>
        )}

        {/* Other Sections - Automatically render with static + dynamic items (BELOW) */}
        {!loading &&
          !error &&
          otherSections.map((section) => {
            const items = getCombinedSectionItems(section);
            if (items.length === 0) return null;

            return (
              <NavMain
                key={section}
                items={items}
                label={formatSectionLabel(section)}
              />
            );
          })}
      </SidebarContent>

      <SidebarFooter>
        {isUserLoading ? <NavUserSkeleton /> : <NavUser user={user} />}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
