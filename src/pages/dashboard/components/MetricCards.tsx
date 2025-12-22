import { TrendingUp, TrendingDown } from "lucide-react";

type ChangeType = "positive" | "negative";

export interface MetricCardData {
  id: string;
  title: string;
  value: string;
  change: string;
  changeType: ChangeType;
  description: string;
  subDescription: string;
  allowedRoles: string[];
}

function MetricCard({ data }: { data: MetricCardData }) {
  const isPositive = data.changeType === "positive";

  return (
    <div className="rounded-xl border border-border/50 bg-card p-5">
      {/* Header: Title + Badge */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{data.title}</span>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            isPositive
              ? "bg-brand/10 text-brand-600 dark:text-brand-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {data.change}
        </span>
      </div>

      {/* Large Value */}
      <div className="mt-2 text-[2.5rem] font-semibold leading-tight tracking-tight">
        {data.value}
      </div>

      {/* Trend Description */}
      <div
        className={`mt-4 flex items-center gap-1.5 text-sm font-medium ${
          isPositive
            ? "text-brand-600 dark:text-brand-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        <span>{data.description}</span>
        {isPositive ? (
          <TrendingUp className="h-4 w-4" />
        ) : (
          <TrendingDown className="h-4 w-4" />
        )}
      </div>

      {/* Sub Description */}
      <p className="mt-0.5 text-sm text-muted-foreground">
        {data.subDescription}
      </p>
    </div>
  );
}

interface MetricCardsProps {
  cards: MetricCardData[];
}

export function MetricCards({ cards }: MetricCardsProps) {
  if (cards.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <MetricCard key={card.id} data={card} />
      ))}
    </div>
  );
}
