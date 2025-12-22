import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { DynamicIcon } from "@/lib/icon-map";
import type { DrawerItem } from "@/types/sidebar";
import {
  fetchLayoutData,
  setCurrentContentItem,
} from "@/signals/dynamicContent";

interface NavMainProps {
  items: DrawerItem[];
  label?: string;
}

export function NavMain({ items, label = "Platform" }: NavMainProps) {
  const location = useLocation();

  // Convert title to URL-friendly slug (e.g., "All Coupons" -> "all-coupons")
  const slugify = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]/g, "");
  };

  const isActive = (item: DrawerItem | any) => {
    if (!item || !item.title) return false;
    // Dashboard is active at /dashboard
    if (item.title === "Dashboard") return location.pathname === "/dashboard";
    const slug = slugify(item.title);
    const expectedPath = `/dashboard/${slug}`;
    return location.pathname === expectedPath;
  };

  const getNavigationPath = (item: DrawerItem | any) => {
    if (!item || !item.title) return "#";
    // Dashboard links to /dashboard directly
    if (item.title === "Dashboard") return "/dashboard";
    const slug = slugify(item.title);
    return `/dashboard/${slug}`;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          
          const hasSubItems = item.subMenuItems && item.subMenuItems.length > 0;

          if (!hasSubItems) {
            // Simple link item without sub-menu
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive(item)}
                >
                  <Link
                    to={getNavigationPath(item)}
                    onClick={() => {
                      console.log(`📍 Clicked: ${item.title}`);
                      setCurrentContentItem(item);

                      if (!item.getLayoutDataUrl) {
                        console.warn("❌ No API URL for:", item.title);
                        return;
                      }

                      console.log(
                        `📡 Fetching layout for ${item.title} from:`,
                        item.getLayoutDataUrl
                      );
                      fetchLayoutData(item.getLayoutDataUrl);
                    }}
                  >
                    {item.icon && (
                      <DynamicIcon
                        name={item.icon}
                        className={`h-5 w-5 ${isActive(item) ? "text-brand-300" : "text-muted-foreground"}`}
                      />
                    )}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          // Collapsible item with sub-menu
          return (
            <Collapsible
              key={item.title}
              asChild
              defaultOpen={isActive(item)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    <DynamicIcon
                      name={item.icon}
                      className="h-5 w-5 text-muted-foreground"
                    />
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.subMenuItems?.map((subItem) => {
                      return (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isActive(subItem)}
                          >
                            <Link
                              to={getNavigationPath(subItem)}
                              onClick={() => {
                                console.log(
                                  `📍 Clicked sub-item: ${subItem.title}`
                                );
                                setCurrentContentItem(subItem);

                                if (subItem?.getLayoutDataUrl) {
                                  console.log(
                                    `📡 Fetching layout for ${subItem.title} from:`,
                                    subItem.getLayoutDataUrl
                                  );
                                  fetchLayoutData(subItem.getLayoutDataUrl);
                                } else if (subItem?.getDataUrl) {
                                  console.log(
                                    `📡 Fetching data for ${subItem.title} from:`,
                                    subItem.getDataUrl
                                  );
                                  fetchLayoutData(subItem.getDataUrl);
                                }
                              }}
                            >
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
