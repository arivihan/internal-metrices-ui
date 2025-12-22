import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Custom hook to detect dark mode
function useIsDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

interface GraphDataset {
  label: string;
  color: string;
  fill?: boolean;
  data: { date: string; value: number }[];
}

interface GraphConfig {
  type: "area" | "line";
  xAxisLabel: string;
  yAxisLabel: string;
  showLegend: boolean;
  showGrid: boolean;
  animated: boolean;
  datasets: GraphDataset[];
}

export interface ChartItem {
  id: string;
  title: string;
  subtitle?: string;
  allowedRoles: string[];
  graph: GraphConfig;
}

interface VisitorsChartProps {
  item: ChartItem;
}

export function VisitorsChart({ item }: VisitorsChartProps) {
  const [timeRange, setTimeRange] = useState("7days");
  const isDark = useIsDarkMode();
  const { graph, title, subtitle } = item;

  // Transform data for recharts - merge all datasets
  const chartData =
    graph.datasets[0]?.data.map((point, index) => {
      const dataPoint: Record<string, string | number> = { date: point.date };
      graph.datasets.forEach((dataset) => {
        dataPoint[dataset.label] = dataset.data[index]?.value || 0;
      });
      return dataPoint;
    }) || [];

  const timeRanges = [
    { id: "3months", label: "Last 3 months" },
    { id: "30days", label: "Last 30 days" },
    { id: "7days", label: "Last 7 days" },
  ];

  // Theme-aware colors
  const colors = {
    brand: "#37D3E7",
    secondary: isDark ? "#a1a1aa" : "#71717a",
    text: isDark ? "#a1a1aa" : "#71717a",
    tooltip: {
      bg: isDark ? "#27272a" : "#ffffff",
      border: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      text: isDark ? "#fafafa" : "#09090b",
      shadow: isDark ? "0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(0,0,0,0.1)",
    },
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-0">
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className="flex rounded-lg border border-border/50 overflow-hidden">
          {timeRanges.map((range) => (
            <button
              key={range.id}
              onClick={() => setTimeRange(range.id)}
              className={`px-4 py-1.5 text-sm transition-colors ${
                timeRange === range.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full px-2 pt-6 pb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 0, right: 20, left: 20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="gradientDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.brand} stopOpacity={isDark ? 0.4 : 0.35} />
                <stop offset="100%" stopColor={colors.brand} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradientMobile" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.secondary} stopOpacity={isDark ? 0.25 : 0.15} />
                <stop offset="100%" stopColor={colors.secondary} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: colors.text, fontSize: 12 }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: colors.tooltip.bg,
                border: `1px solid ${colors.tooltip.border}`,
                borderRadius: "8px",
                boxShadow: colors.tooltip.shadow,
              }}
              labelStyle={{ color: colors.tooltip.text, fontWeight: 600 }}
              itemStyle={{ color: colors.text }}
            />
            {/* Desktop - brand color area on top */}
            <Area
              type="monotone"
              dataKey="Desktop"
              stroke={colors.brand}
              strokeWidth={2}
              fill="url(#gradientDesktop)"
              isAnimationActive={graph.animated}
            />
            {/* Mobile - secondary area below */}
            <Area
              type="monotone"
              dataKey="Mobile"
              stroke={colors.secondary}
              strokeWidth={1.5}
              fill="url(#gradientMobile)"
              isAnimationActive={graph.animated}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
