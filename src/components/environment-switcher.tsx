import * as React from "react"
import { ChevronsUpDown, Server, FlaskConical, Rocket } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

const environments = [
  {
    name: "Development",
    value: "dev",
    icon: FlaskConical,
    color: "text-yellow-500",
  },
  {
    name: "Staging",
    value: "staging",
    icon: Server,
    color: "text-blue-500",
  },
  {
    name: "Production",
    value: "prod",
    icon: Rocket,
    color: "text-green-500",
  },
]

export function EnvironmentSwitcher() {
  const { isMobile, state } = useSidebar()
  const [activeEnv, setActiveEnv] = React.useState(environments[0])
  const isCollapsed = state === "collapsed"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild> */}
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden">
                <img src="/arivihan.jpeg" alt="Arivihan" className="size-8 object-cover" />
              </div>
              {!isCollapsed && (
                <>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">Internal Metrics</span>
                    <span className={`truncate text-xs ${activeEnv.color}`}>
                      {activeEnv.name}
                    </span>
                  </div>
                  {/* <ChevronsUpDown className="ml-auto size-4" /> */}
                </>
              )}
            </SidebarMenuButton>
          {/* </DropdownMenuTrigger> */}
          {/* <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Environment
            </DropdownMenuLabel>
            {environments.map((env) => (
              <DropdownMenuItem
                key={env.value}
                onClick={() => setActiveEnv(env)}
                className="gap-2 p-2"
              >
                <div className={`flex size-6 items-center justify-center rounded-md border ${activeEnv.value === env.value ? 'bg-primary/10' : ''}`}>
                  <env.icon className={`size-3.5 shrink-0 ${env.color}`} />
                </div>
                <span className={activeEnv.value === env.value ? 'font-medium' : ''}>
                  {env.name}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent> */}
        {/* </DropdownMenu> */}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
