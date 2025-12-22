import { useNavigate } from "react-router-dom"
import { useSignals } from "@preact/signals-react/runtime"
import { useState, useEffect } from "react"
import {
  TextSearch,
  Radio,
  GraduationCap,
  FileStack,
  TrendingUp,
  UserCog,
  HelpCircle,
  Activity,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { userDisplay, userRoles } from "@/signals/auth"
import {
  fetchDashboardServices,
  type DashboardService,
} from "@/services/dashboardSelect"

// Icon mapping for dashboards - Backend sends icon name, frontend renders Lucide icon
const iconMap: Record<string, LucideIcon> = {
  TextSearch,
  Radio,
  GraduationCap,
  FileStack,
  TrendingUp,
  UserCog,
  HelpCircle,
  Activity,
}

// Color schemes for dashboard icons (cycled based on index)
const colorSchemes = [
  { bgColor: "bg-purple-100 dark:bg-purple-950", iconColor: "text-purple-500 dark:text-purple-400" },
  { bgColor: "bg-red-100 dark:bg-red-950", iconColor: "text-red-500 dark:text-red-400" },
  { bgColor: "bg-blue-100 dark:bg-blue-950", iconColor: "text-blue-500 dark:text-blue-400" },
  { bgColor: "bg-orange-100 dark:bg-orange-950", iconColor: "text-orange-500 dark:text-orange-400" },
  { bgColor: "bg-indigo-100 dark:bg-indigo-950", iconColor: "text-indigo-500 dark:text-indigo-400" },
  { bgColor: "bg-amber-100 dark:bg-amber-950", iconColor: "text-amber-600 dark:text-amber-400" },
  { bgColor: "bg-cyan-100 dark:bg-cyan-950", iconColor: "text-cyan-500 dark:text-cyan-400" },
  { bgColor: "bg-green-100 dark:bg-green-950", iconColor: "text-green-500 dark:text-green-400" },
]

const DashboardSelect = () => {
  useSignals()
  const navigate = useNavigate()
  const user = userDisplay.value
  const roles = userRoles.value

  const [inHouseServices, setInHouseServices] = useState<DashboardService[]>([])
  const [externalServices, setExternalServices] = useState<DashboardService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchDashboardServices()
        setInHouseServices(data.inHouseServices)
        setExternalServices(data.externalServices)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    loadServices()
  }, [])

  // Filter services based on user roles
  const hasAccess = (accessibleToRoles: string[]) => {
    if (!accessibleToRoles || accessibleToRoles.length === 0) return true
    return roles.some((role) => accessibleToRoles.includes(role))
  }

  const filteredInHouseServices = inHouseServices.filter((service) =>
    hasAccess(service.accessibleToRoles)
  )

  const filteredExternalServices = externalServices.filter((service) =>
    hasAccess(service.accessibleToRoles)
  )

  const handleDashboardClick = (service: DashboardService) => {
    // Check if it's an internal route (starts with /)
    if (service.url.startsWith("/")) {
      navigate(service.url === "/" ? "/dashboard" : service.url)
    } else {
      window.open(service.url, "_blank", "noopener,noreferrer")
    }
  }

  const handleServiceClick = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer")
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

  // Get icon component from icon name string
  const getIcon = (iconUrl: string): LucideIcon => {
    return iconMap[iconUrl] || HelpCircle
  }

  // Get color scheme based on index
  const getColorScheme = (index: number) => {
    return colorSchemes[index % colorSchemes.length]
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
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading services...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-4 py-20">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : (
            /* Dashboards Section */
            <div className="grid grid-cols-2 gap-x-8 gap-y-16 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredInHouseServices.map((service, index) => {
                const Icon = getIcon(service.iconUrl)
                const colors = getColorScheme(index)
                return (
                  <button
                    key={service.name}
                    onClick={() => handleDashboardClick(service)}
                    className="group flex flex-col items-center gap-3 text-center"
                  >
                    <div
                      className={`flex h-20 w-20 items-center justify-center rounded-2xl ${colors.bgColor} transition-transform duration-200 group-hover:scale-105`}
                    >
                      <Icon className={`h-9 w-9 ${colors.iconColor}`} strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">
                      {service.name}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer - External Services */}
      {!loading && !error && filteredExternalServices.length > 0 && (
        <footer className="py-8 px-6 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-8">
            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-sm text-muted-foreground">
                  External Services
                </span>
              </div>
            </div>

            {/* Services */}
            <div className="flex items-center justify-center gap-16">
              {filteredExternalServices.map((service) => (
                <button
                  key={service.name}
                  onClick={() => handleServiceClick(service.url)}
                  className="group flex flex-col items-center gap-2.5 text-center"
                >
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-muted/50 transition-transform duration-200 group-hover:scale-105">
                    <img
                      src={service.iconUrl}
                      alt={service.name}
                      className="h-10 w-10 object-contain"
                    />
                    <ExternalLink className="absolute -right-1 -top-1 h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">
                    {service.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}

export default DashboardSelect
