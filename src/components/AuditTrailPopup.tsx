import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight, Code2, Eye } from "lucide-react";

// @ts-ignore
export const AuditTrailPopup = ({ open, onClose, data, title }) => {
  const [viewMode, setViewMode] = useState<"formatted" | "json">("formatted");
  const [expandedBatches, setExpandedBatches] = useState<
    Record<string, boolean>
  >({});
  const [expandedEntries, setExpandedEntries] = useState<
    Record<string, boolean>
  >({});

  if (!data || !Array.isArray(data)) return null;

  // Group audit trail entries by date and sort by latest first
  const groupAuditTrailByDate = (entries: any[]): Record<string, any[]> => {
    const groups: Record<string, any[]> = {};

    // Sort by timestamp (latest first)
    const sorted = [...entries].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    sorted.forEach((entry) => {
      // Extract date from timestamp
      const dateKey = entry.timestamp.split("T")[0];
      const dateLabel = new Date(dateKey).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });

      const groupKey = `${dateKey} (${dateLabel})`;

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(entry);
    });

    return groups;
  };

  const groupedData = groupAuditTrailByDate(data);

  // Expand all batches by default
  const defaultExpandedBatchState = Object.keys(groupedData).reduce(
    (acc, key) => {
      acc[key] = true;
      return acc;
    },
    {} as Record<string, boolean>
  );

  const finalExpandedBatches =
    Object.keys(expandedBatches).length === 0
      ? defaultExpandedBatchState
      : expandedBatches;

  // Helper function to format values
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Active" : "Inactive";
    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  };

  // Helper function to get type label
  const getTypeLabel = (value: any): string => {
    if (value === null || value === undefined) return "null";
    if (Array.isArray(value)) return `array[${value.length}]`;
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return "number";
    if (typeof value === "string") return "string";
    if (typeof value === "object") return "object";
    return typeof value;
  };

  // Helper function to format field names
  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const toggleEntryExpansion = (batchKey: string, entryIndex: number) => {
    const key = `${batchKey}-${entryIndex}`;
    setExpandedEntries((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const isEntryExpanded = (batchKey: string, entryIndex: number): boolean => {
    const key = `${batchKey}-${entryIndex}`;
    return expandedEntries[key] || false;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-w-[70vw] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {title || "Audit Trail"}
              </DialogTitle>
              <DialogDescription className="mt-1">
                Track all changes and modifications
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "formatted" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("formatted")}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Formatted
              </Button>
              <Button
                variant={viewMode === "json" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("json")}
                className="gap-2"
              >
                <Code2 className="h-4 w-4" />
                JSON
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>

          {viewMode === "formatted" ? (
            <div className="space-y-4">
              {Object.entries(groupedData).map(([dateLabel, entries]) => (
                <div
                  key={dateLabel}
                  className="border rounded-lg overflow-hidden shadow-sm"
                >
                  {/* Date Batch Header */}
                  <button
                    onClick={() =>
                      setExpandedBatches((prev) => ({
                        ...prev,
                        [dateLabel]: !prev[dateLabel],
                      }))
                    }
                    className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted px-4 py-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          finalExpandedBatches[dateLabel] ? "rotate-180" : ""
                        }`}
                      />
                      <span className="font-semibold text-sm">{dateLabel}</span>
                      <Badge variant="secondary" className="ml-2">
                        {entries.length} change{entries.length > 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </button>

                  {/* Audit Entries */}
                  {finalExpandedBatches[dateLabel] && (
                    <div className="divide-y">
                      {entries.map((entry, idx) => {
                        const isExpanded = isEntryExpanded(dateLabel, idx);
                        return (
                          <div
                            key={idx}
                            className="hover:bg-muted/20 transition-colors"
                          >
                            {/* Entry Summary Header */}
                            <button
                              onClick={() =>
                                toggleEntryExpansion(dateLabel, idx)
                              }
                              className="w-full p-4 flex items-start justify-between text-left"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )}
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 font-medium">
                                    {entry.actionType}
                                  </Badge>
                                  <span className="text-sm font-medium text-muted-foreground">
                                    {new Date(
                                      entry.timestamp
                                    ).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      second: "2-digit",
                                      hour12: true,
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm text-foreground ml-6">
                                  <span className="font-medium">By- </span>
                                  <span className="text-muted-foreground">
                                    {entry.performedBy}
                                  </span>
                                </p>
                                {!isExpanded &&
                                  (entry.oldValue || entry.newValue) && (
                                    <p className="text-xs text-muted-foreground ml-6 mt-1">
                                      {
                                        Object.keys({
                                          ...entry.oldValue,
                                          ...entry.newValue,
                                        }).length
                                      }{" "}
                                      field(s) modified
                                    </p>
                                  )}
                              </div>
                            </button>

                            {/* Expanded Entry Details */}
                            {isExpanded &&
                              (entry.oldValue || entry.newValue) && (
                                <div className="px-4 pb-4 ml-6">
                                  <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="bg-muted/50 border-b">
                                          <th className="text-left py-3 px-4 font-semibold w-[30%]">
                                            Field Name
                                          </th>
                                          <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground w-[15%]">
                                            Type
                                          </th>
                                          <th className="text-center py-3 px-4 font-semibold w-[27.5%]">
                                            Old Value
                                          </th>
                                          <th className="text-center py-3 px-4 font-semibold w-[27.5%]">
                                            New Value
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                        {Object.keys({
                                          ...entry.oldValue,
                                          ...entry.newValue,
                                        }).map((key) => (
                                          <tr
                                            key={key}
                                            className="hover:bg-muted/30"
                                          >
                                            <td className="py-3 px-4 font-medium text-foreground">
                                              {formatFieldName(key)}
                                            </td>
                                            <td className="py-3 px-4">
                                              <Badge
                                                variant="secondary"
                                                className="text-xs font-mono"
                                              >
                                                {getTypeLabel(
                                                  entry.newValue?.[key] ||
                                                    entry.oldValue?.[key]
                                                )}
                                              </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                              <div className="flex items-center justify-center">
                                                <span className="text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded font-mono text-center max-w-full truncate">
                                                  {entry.oldValue?.[key] !==
                                                  undefined
                                                    ? formatValue(
                                                        entry.oldValue[key]
                                                      )
                                                    : "—"}
                                                </span>
                                              </div>
                                            </td>
                                            <td className="py-3 px-4">
                                              <div className="flex items-center justify-center">
                                                <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded font-mono text-center max-w-full truncate">
                                                  {entry.newValue?.[key] !==
                                                  undefined
                                                    ? formatValue(
                                                        entry.newValue[key]
                                                      )
                                                    : "—"}
                                                </span>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {data.length === 0 && (
                <div className="text-center text-muted-foreground py-8 border rounded-lg">
                  No audit trail data available
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-4 border">
              <pre className="text-sm font-mono whitespace-pre-wrap text-foreground overflow-x-auto">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose} className="min-w-[100px]">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
