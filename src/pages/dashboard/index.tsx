import { useSignals } from "@preact/signals-react/runtime";
import { userRoles } from "@/signals/auth";
import {
  MetricCards,
  VisitorsChart,
  DataTable,
  type MetricCardData,
  type ChartItem,
  type TableItem,
} from "./components";
import dashboardData from "./data.json";

const hasAccess = (allowedRoles: string[], currentRoles: string[]): boolean => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.some((role) => currentRoles.includes(role));
};

export default function Dashboard() {
  useSignals();
  const roles = userRoles.value;
  const { layout } = dashboardData.dashboard;

  // Filter items based on user roles
  const visibleMetricCards = layout.top.items.filter((item) =>
    hasAccess(item.allowedRoles, roles)
  ) as MetricCardData[];

  const visibleCharts = layout.middle.items.filter((item) =>
    hasAccess(item.allowedRoles, roles)
  ) as ChartItem[];

  const visibleTables = layout.bottom.items.filter((item) =>
    hasAccess(item.allowedRoles, roles)
  ) as TableItem[];

  return (
    <div className="flex flex-1 flex-col gap-6 pb-6">
      {/* Top: Metric Cards */}
      {hasAccess(layout.top.allowedRoles, roles) &&
        visibleMetricCards.length > 0 && (
          <MetricCards cards={visibleMetricCards} />
        )}

      {/* Middle: Charts */}
      {hasAccess(layout.middle.allowedRoles, roles) &&
        visibleCharts.length > 0 && (
          <div className="grid gap-4">
            {visibleCharts.map((chart) => (
              <VisitorsChart key={chart.id} item={chart} />
            ))}
          </div>
        )}

      {/* Bottom: Tables */}
      {hasAccess(layout.bottom.allowedRoles, roles) &&
        visibleTables.length > 0 && (
          <div className="grid gap-4">
            {visibleTables.map((table) => (
              <DataTable key={table.id} item={table} />
            ))}
          </div>
        )}
    </div>
  );
}
