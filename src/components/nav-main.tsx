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

  const isActive = (url?: string) => {
    if (!url) return false;
    // Ensure URL starts with /dashboard
    const fullUrl = url.startsWith("/dashboard") ? url : `/dashboard${url}`;
    return (
      location.pathname === fullUrl ||
      location.pathname.startsWith(fullUrl + "/")
    );
  };

  const getFullUrl = (url?: string) => {
    if (!url) return "#";
    return url.startsWith("/dashboard") ? url : `/dashboard${url}`;
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
                  isActive={isActive(item.getDataUrl)}
                >
                  <Link to={getFullUrl(item.getDataUrl)}>
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
              defaultOpen={isActive(item.getDataUrl)}
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
                            isActive={isActive(subItem.getDataUrl)}
                          >
                            <Link to={getFullUrl(subItem.getDataUrl)}>
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
