import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight, ChevronLeft, Code2, Eye } from "lucide-react";

interface AuditTrailPopupProps {
  open: boolean;
  onClose: () => void;
  data: any[];
  title?: string;
  currentPage?: number;
  totalPages?: number;
  totalElements?: number;
  pageSize?: number;
  isLoading?: boolean;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export const AuditTrailPopup = ({
  open,
  onClose,
  data,
  title,
  currentPage = 0,
  totalPages = 1,
  totalElements = 0,
  pageSize = 10,
  isLoading = false,
  onPageChange,
  onPageSizeChange,
}: AuditTrailPopupProps) => {
  const [viewMode, setViewMode] = useState<"formatted" | "json">("formatted");
  const [expandedBatches, setExpandedBatches] = useState<
    Record<string, boolean>
  >({});
  const [expandedEntries, setExpandedEntries] = useState<
    Record<string, boolean>
  >({});

  if (!open) return null;

  const auditData = data || [];

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

  const groupedData = groupAuditTrailByDate(auditData);

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

  // Expand all entries by default
  const defaultExpandedEntriesState = Object.entries(groupedData).reduce(
    (acc, [batchKey, entries]) => {
      entries.forEach((_, idx) => {
        acc[`${batchKey}-${idx}`] = true;
      });
      return acc;
    },
    {} as Record<string, boolean>
  );

  const finalExpandedEntries =
    Object.keys(expandedEntries).length === 0
      ? defaultExpandedEntriesState
      : expandedEntries;

  // Helper function to format values
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "Active" : "Inactive";
    if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "—";
    if (typeof value === "object") {
      // Check if object is empty
      if (Object.keys(value).length === 0) return "—";
      return JSON.stringify(value);
    }
    // Handle empty strings
    const strValue = String(value);
    return strValue.trim() === "" ? "—" : strValue;
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
    return finalExpandedEntries[key] || false;
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-[80vw] max-w-[80vw] sm:max-w-[90vw] p-0 flex flex-col"
      >
        <SheetHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between pr-8">
            <div>
              <SheetTitle className="text-xl font-semibold">
                {title || "Audit Trail"}
              </SheetTitle>
              <SheetDescription className="mt-1">
                Track all changes and modifications
              </SheetDescription>
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
        </SheetHeader>

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
                                          ...(entry.oldValue || {}),
                                          ...(entry.newValue || {}),
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
                                          <th className="text-left py-3 px-4 font-semibold w-[20%]">
                                            Field Name
                                          </th>
                                          <th className="text-left py-3 px-4 font-semibold text-xs text-muted-foreground w-[10%]">
                                            Type
                                          </th>
                                          <th className="text-left py-3 px-4 font-semibold w-[35%]">
                                            Old Value
                                          </th>
                                          <th className="text-left py-3 px-4 font-semibold w-[35%]">
                                            New Value
                                          </th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y">
                                        {Object.keys({
                                          ...(entry.oldValue || {}),
                                          ...(entry.newValue || {}),
                                        }).map((key) => (
                                          <tr
                                            key={key}
                                            className="hover:bg-muted/30"
                                          >
                                            <td className="py-3 px-4 font-medium text-foreground align-top">
                                              {formatFieldName(key)}
                                            </td>
                                            <td className="py-3 px-4 align-top">
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
                                            <td className="py-3 px-4 align-top">
                                              <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded font-mono break-all whitespace-pre-wrap">
                                                {entry.oldValue?.[key] !==
                                                undefined
                                                  ? formatValue(
                                                      entry.oldValue[key]
                                                    )
                                                  : "—"}
                                              </div>
                                            </td>
                                            <td className="py-3 px-4 align-top">
                                              <div className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded font-mono break-all whitespace-pre-wrap">
                                                {entry.newValue?.[key] !==
                                                undefined
                                                  ? formatValue(
                                                      entry.newValue[key]
                                                    )
                                                  : "—"}
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

              {auditData.length === 0 && !isLoading && (
                <div className="text-center text-muted-foreground py-8 border rounded-lg">
                  No audit trail data available
                </div>
              )}

              {isLoading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-5 w-40" />
                        <Skeleton className="h-5 w-16" />
                      </div>
                      <div className="space-y-2 ml-7">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-muted rounded-lg p-4 border">
              <pre className="text-sm font-mono whitespace-pre-wrap text-foreground overflow-x-auto">
                {JSON.stringify(auditData, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t bg-muted/20">
          <div className="flex items-center justify-between w-full">
            {/* Pagination Info */}
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {totalElements > 0 ? (
                  <>
                    Showing {currentPage * pageSize + 1} -{" "}
                    {Math.min((currentPage + 1) * pageSize, totalElements)} of{" "}
                    {totalElements} entries
                  </>
                ) : (
                  "No entries"
                )}
              </div>

              {/* Page Size Selector */}
              {onPageSizeChange && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Per page:</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => onPageSizeChange(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {onPageChange && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 0 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="flex h-8 min-w-[3rem] items-center justify-center rounded-md border text-sm px-2">
                    {currentPage + 1} / {totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={onClose} className="min-w-[100px] ml-4">
                Close
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
