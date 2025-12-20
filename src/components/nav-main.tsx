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
import { getIcon } from "@/lib/icon-map";
import type { DrawerItem } from "@/types/sidebar";

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
    const slug = slugify(item.title);
    const expectedPath = `/dashboard/${slug}`;
    return location.pathname === expectedPath;
  };
const fetchspecificDataByUrl = async <T = any,>(url: string): Promise<T> => {
  if (!url) {
    throw new Error("API URL is empty");
  }

  const response = await fetch(url);

  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    const text = await response.text();
    console.error("Non-JSON response:", text);
    throw new Error("Response is not JSON");
  }

  return response.json();
};


  const getNavigationPath = (item: DrawerItem | any) => {
    if (!item || !item.title) return "#";
    const slug = slugify(item.title);
    return `/dashboard/${slug}`;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const Icon = getIcon(item.icon);
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
                      if (!item.getLayoutDataUrl) {
                        console.warn("No API URL for:", item.title);
                        return;
                      }

                      fetchspecificDataByUrl(item.getLayoutDataUrl)
                        .then((data) => {
                          console.log("API DATA:", data);
                        })
                        .catch((err) => console.error(err));
                    }}
                  >
                    {Icon && <Icon />}
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
                    {Icon && <Icon />}
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
                              onClick={() =>
                                console.log(`click ${subItem.title}`)
                              }
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
