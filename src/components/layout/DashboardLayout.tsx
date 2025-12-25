import { Outlet, useLocation, Link } from "react-router-dom";
import { useSignals } from "@preact/signals-react/runtime";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { currentContentItem } from "@/signals/dynamicContent";

interface BreadcrumbSegment {
  label: string;
  path?: string; // If undefined, it's the current page (no link)
}

export function DashboardLayout() {
  useSignals();
  const location = useLocation();
  const { drawerItems } = useSidebar();

  // Build breadcrumb segments based on current path
  const getBreadcrumbs = (): BreadcrumbSegment[] => {
    const pathname = location.pathname;

    // If there's a current content item (from sidebar click), show it
    if (currentContentItem.value) {
      return [{ label: currentContentItem.value.title }];
    }

    // Dashboard root
    if (pathname === "/dashboard") {
      return [{ label: "Dashboard" }];
    }

    // Users detail page
    if (pathname.startsWith("/dashboard/users/detail/")) {
      return [
        { label: "Users", path: "/dashboard/users" },
        { label: "Details" },
      ];
    }

    // Users list page
    if (pathname === "/dashboard/users") {
      return [{ label: "Users" }];
    }

    // Notifications page
    if (pathname === "/dashboard/notifications") {
      return [{ label: "Notifications" }];
    }

    // ASAT Scorecards page
    if (pathname === "/dashboard/asat-scorecards") {
      return [{ label: "ASAT Scorecards" }];
    }

    // SQL Playground create/edit page
    if (pathname === "/dashboard/sql-playground/create") {
      return [
        { label: "SQL Playground", path: "/dashboard/sql-playground" },
        { label: "Create Query" },
      ];
    }

    // SQL Playground page
    if (pathname === "/dashboard/sql-playground") {
      return [{ label: "SQL Playground" }];
    }

    // App Configs page
    if (pathname === "/dashboard/app-configs") {
      return [{ label: "App Configs" }];
    }

    // Chapters page
    if (pathname === "/dashboard/chapters") {
      return [{ label: "Chapters" }];
    }

    // Check dynamic sidebar items
    for (const item of drawerItems) {
      const itemUrl = item.getDataUrl?.startsWith("/dashboard")
        ? item.getDataUrl
        : `/dashboard${item.getDataUrl || ""}`;

      if (itemUrl === pathname) {
        return [{ label: item.title }];
      }
      if (item.subMenuItems) {
        for (const subItem of item.subMenuItems) {
          const subItemUrl = subItem.getDataUrl?.startsWith("/dashboard")
            ? subItem.getDataUrl
            : `/dashboard${subItem.getDataUrl || ""}`;

          if (subItemUrl === pathname) {
            return [{ label: subItem.title }];
          }
        }
      }
    }

    return [{ label: "Page" }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
           
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink asChild>
                      <Link to="/dashboard">Internal Metrics</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  {breadcrumbs.map((segment, index) => (
                    <span key={index} className="contents">
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        {segment.path ? (
                          <BreadcrumbLink asChild>
                            <Link to={segment.path}>{segment.label}</Link>
                          </BreadcrumbLink>
                        ) : (
                          <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                        )}
                      </BreadcrumbItem>
                    </span>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
