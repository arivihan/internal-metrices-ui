import { useNavigate } from "react-router-dom"
import { useSignals } from "@preact/signals-react/runtime"
import {
  BarChart3,
  FileText,
  CircleDollarSign,
  Building2,
  FolderKanban,
  ShoppingCart,
  Factory,
  Target,
  UsersRound,
  Building,
  Home,
  Settings,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { userDisplay } from "@/signals/auth"

interface Dashboard {
  id: string
  title: string
  route: string
  icon: LucideIcon
  bgColor: string
  iconColor: string
}

// Dashboard apps configuration
const dashboards: Dashboard[] = [
  {
    id: "internal-metrics",
    title: "Internal Metrics",
    route: "/dashboard",
    icon: BarChart3,
    bgColor: "bg-purple-100 dark:bg-purple-950",
    iconColor: "text-purple-500 dark:text-purple-400",
  },
  {
    id: "documents",
    title: "Documents",
    route: "/documents",
    icon: FileText,
    bgColor: "bg-orange-100 dark:bg-orange-950",
    iconColor: "text-orange-500 dark:text-orange-400",
  },
  {
    id: "accounting",
    title: "Accounting",
    route: "/accounting",
    icon: CircleDollarSign,
    bgColor: "bg-green-100 dark:bg-green-950",
    iconColor: "text-green-500 dark:text-green-400",
  },
  {
    id: "inventory",
    title: "Inventory",
    route: "/inventory",
    icon: Building2,
    bgColor: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  {
    id: "project",
    title: "Project",
    route: "/project",
    icon: FolderKanban,
    bgColor: "bg-violet-100 dark:bg-violet-950",
    iconColor: "text-violet-500 dark:text-violet-400",
  },
  {
    id: "procurement",
    title: "Procurement",
    route: "/procurement",
    icon: ShoppingCart,
    bgColor: "bg-pink-100 dark:bg-pink-950",
    iconColor: "text-pink-500 dark:text-pink-400",
  },
  {
    id: "manufacturing",
    title: "Manufacturing",
    route: "/manufacturing",
    icon: Factory,
    bgColor: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-700 dark:text-amber-400",
  },
  {
    id: "crm",
    title: "CRM",
    route: "/crm",
    icon: Target,
    bgColor: "bg-indigo-100 dark:bg-indigo-950",
    iconColor: "text-indigo-500 dark:text-indigo-400",
  },
  {
    id: "hrms",
    title: "HRMS",
    route: "/hrms",
    icon: UsersRound,
    bgColor: "bg-cyan-100 dark:bg-cyan-950",
    iconColor: "text-cyan-500 dark:text-cyan-400",
  },
  {
    id: "office",
    title: "Office",
    route: "/office",
    icon: Building,
    bgColor: "bg-emerald-100 dark:bg-emerald-950",
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  {
    id: "rental",
    title: "Rental",
    route: "/rental",
    icon: Home,
    bgColor: "bg-teal-100 dark:bg-teal-950",
    iconColor: "text-teal-500 dark:text-teal-400",
  },
  {
    id: "settings",
    title: "Settings",
    route: "/settings",
    icon: Settings,
    bgColor: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-500 dark:text-slate-400",
  },
]

const DashboardSelect = () => {
  useSignals()
  const navigate = useNavigate()
  const user = userDisplay.value

  const handleSelect = (route: string) => {
    navigate(route)
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 items-center justify-between px-6 lg:px-10">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center">
              <img
                src="/arivihan.jpeg"
                alt="Arivihan"
                className="h-8 w-8 rounded-lg object-cover"
              />
            </div>
            <span className="text-lg font-semibold text-foreground">Arivihan</span>
          </div>

          {/* Right side - User */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-sm font-medium text-white">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.roles?.[0] || "Admin"}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 items-center justify-center px-6 py-10 lg:px-10">
        <div className="w-full max-w-6xl">
          {/* Apps Grid */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {dashboards.map((dashboard) => {
              const Icon = dashboard.icon
              return (
                <button
                  key={dashboard.id}
                  onClick={() => handleSelect(dashboard.route)}
                  className="group flex flex-col items-center gap-3 text-center"
                >
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-2xl ${dashboard.bgColor} transition-transform duration-200 group-hover:scale-105`}
                  >
                    <Icon className={`h-9 w-9 ${dashboard.iconColor}`} strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                    {dashboard.title}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}

export default DashboardSelect
