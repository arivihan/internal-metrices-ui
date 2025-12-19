import { useNavigate } from "react-router-dom"
import { useSignals } from "@preact/signals-react/runtime"
import { ArrowRight } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { userDisplay } from "@/signals/auth"

// Hardcoded dashboard options (will come from API later)
const dashboards = [
  {
    id: "internal-metrics",
    title: "Internal Metrics",
    description: "Analytics and metrics for internal operations",
    route: "/dashboard",
    color: "from-blue-500/20 to-indigo-500/20",
  },
  {
    id: "sme-dashboard",
    title: "SME Dashboard",
    description: "Subject Matter Expert performance tracking",
    route: "/sme-dashboard",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    id: "live-dashboard",
    title: "Live Dashboard",
    description: "Real-time live session monitoring",
    route: "/live-dashboard",
    color: "from-orange-500/20 to-amber-500/20",
  },
  {
    id: "pdf-circle",
    title: "PDF Circle Dashboard",
    description: "PDF resources and circle analytics",
    route: "/pdf-circle-dashboard",
    color: "from-purple-500/20 to-pink-500/20",
  },
  {
    id: "neet-dashboard",
    title: "NEET Dashboard",
    description: "NEET exam preparation metrics",
    route: "/neet-dashboard",
    color: "from-rose-500/20 to-red-500/20",
  },
]

const DashboardSelect = () => {
  useSignals()
  const navigate = useNavigate()
  const user = userDisplay.value

  const handleSelect = (route: string) => {
    navigate(route)
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img
              src="/arivihan.jpeg"
              alt="Arivihan"
              className="h-8 w-8 rounded-lg object-cover"
            />
            <span className="text-lg font-semibold">Arivihan</span>
          </div>
          {user && (
            <div className="text-sm text-muted-foreground">
              Welcome, <span className="font-medium text-foreground">{user.name}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Select a Dashboard
            </h1>
          </div>

          {/* Dashboard Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {dashboards.map((dashboard) => (
              <Card
                key={dashboard.id}
                className="group cursor-pointer overflow-hidden transition-colors duration-300 ease-in-out hover:border-primary/50"
                onClick={() => handleSelect(dashboard.route)}
              >
                <CardContent className="p-0">
                  {/* Thumbnail Skeleton */}
                  <div
                    className={`relative h-24 bg-gradient-to-br ${dashboard.color}`}
                  >
                    <Skeleton className="absolute inset-3 rounded-md opacity-50" />
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {dashboard.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {dashboard.description}
                        </p>
                      </div>
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted transition-colors duration-300 ease-in-out group-hover:bg-primary group-hover:text-primary-foreground">
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          Arivihan Internal Tools
        </div>
      </footer>
    </div>
  )
}

export default DashboardSelect
