import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Code2, Eye } from "lucide-react";

// @ts-ignore
export const ViewDetailsPopup = ({ open, onClose, data, title }) => {
  const [viewMode, setViewMode] = useState<"formatted" | "json">("formatted");

  if (!data) return null;

  // Helper function to check if a value is an epoch timestamp
  const isEpochTimestamp = (value: any): boolean => {
    if (typeof value !== "number") return false;
    // Check if it's a reasonable timestamp (between 2000 and 2100)
    const minTimestamp = 946684800000; // Jan 1, 2000
    const maxTimestamp = 4102444800000; // Jan 1, 2100
    return value >= minTimestamp && value <= maxTimestamp;
  };

  // Helper function to check if string is ISO datetime format
  const isISODateTime = (value: string): boolean => {
    if (typeof value !== "string") return false;
    // ISO 8601 format: 2025-12-30T12:52:36 or with Z/timezone
    const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return isoRegex.test(value);
  };

  // Helper function to check if field name suggests it's a date/time field
  const isDateField = (key: string): boolean => {
    // Fields to exclude from epoch formatting (already formatted as DD/MM/YYYY)
    const excludeFields = [
      "validfrom",
      "validto",
      "validfrominstring",
      "validtoinstring",
    ];

    const lowerKey = key.toLowerCase();

    // Skip excluded fields
    if (excludeFields.includes(lowerKey)) {
      return false;
    }

    // Format fields with "At" suffix or containing "date"/"time" (createdAt, updatedAt, modifiedAt)
    const dateKeywords = [
      "createdat",
      "updatedat",
      "modifiedat",
      "deletedat",
      "publishedat",
      "scheduledat",
      "expiredat",
      "date",
      "time",
    ];

    return dateKeywords.some((keyword) => lowerKey.includes(keyword));
  };

  // Helper function to format epoch timestamp to readable date
  const formatDate = (timestamp: number): string => {
    try {
      const date = new Date(timestamp);

      // Format: Dec 25, 2024, 10:30 AM
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };

      return date.toLocaleString("en-US", options);
    } catch (error) {
      return String(timestamp);
    }
  };

  // Helper function to format ISO datetime string to readable date
  const formatISODateTime = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      // Format: Dec 25, 2024, 10:30 AM
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };
      return date.toLocaleString("en-US", options);
    } catch (error) {
      return isoString;
    }
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

  // Helper function to format values for display
  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return "-";

    // Check if it's an ISO datetime string in a date field
    if (typeof value === "string" && isISODateTime(value) && isDateField(key)) {
      return formatISODateTime(value);
    }

    // Check if it's a date field with epoch timestamp
    if (isDateField(key) && isEpochTimestamp(value)) {
      return formatDate(value);
    }

    if (typeof value === "boolean") return value ? "Active" : "Inactive";
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "-";
    }
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    return String(value);
  };

  // Helper function to check if value is boolean for badge styling
  const isBooleanField = (value: any): boolean => {
    return typeof value === "boolean";
  };

  // Helper function to check if value should be displayed as a date badge
  const isFormattedDate = (key: string, value: any): boolean => {
    return isDateField(key) && isEpochTimestamp(value);
  };

  // Helper function to format field names (convert camelCase to Title Case)
  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1") // Add space before capital letters
      .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
      .trim();
  };

  // Helper function to flatten nested objects into parent.child format
  const flattenObject = (obj: any, prefix = ""): Array<[string, any]> => {
    const result: Array<[string, any]> = [];

    // Fields to exclude from display (API response metadata)
    const excludeFields = ["message", "code", "status", "success", "error"];

    Object.entries(obj).forEach(([key, value]) => {
      // Skip internal fields and API metadata
      if (
        key.startsWith("_") ||
        key === "id" ||
        excludeFields.includes(key.toLowerCase())
      )
        return;

      const fullKey = prefix ? `${prefix}.${key}` : key;

      // If value is an object or array, flatten it recursively
      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        result.push(...flattenObject(value, fullKey));
      } else if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === "object"
      ) {
        // For array of objects, show count and expand each item
        result.push([fullKey, value.length]);
        value.forEach((item, index) => {
          if (typeof item === "object") {
            result.push(...flattenObject(item, `${fullKey}[${index}]`));
          } else {
            result.push([`${fullKey}[${index}]`, item]);
          }
        });
      } else {
        // Primitive values go straight into result
        result.push([fullKey, value]);
      }
    });

    return result;
  };

  // Convert object to array of key-value pairs, excluding internal fields
  const dataEntries = flattenObject(data);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-w-[70vw] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {title || "View Details"}
              </DialogTitle>
              <DialogDescription>
                {data.id && (
                  <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded inline-block mt-2">
                    ID: {data.id}
                  </span>
                )}
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
            <div className="border rounded-lg shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="w-[30%] font-semibold text-base">
                      Field
                    </TableHead>
                    <TableHead className="w-[15%] font-semibold text-xs text-muted-foreground">
                      Type
                    </TableHead>
                    <TableHead className="font-semibold text-base">
                      Value
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataEntries.length > 0 ? (
                    dataEntries.map(([key, value]) => (
                      <TableRow key={key} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground py-4">
                          {formatFieldName(key)}
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge
                            variant="secondary"
                            className="text-xs font-mono"
                          >
                            {getTypeLabel(value)}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="max-w-full break-words">
                            {isBooleanField(value) ? (
                              <Badge
                                variant={value ? "default" : "secondary"}
                                className={
                                  value
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                }
                              >
                                {formatValue(key, value)}
                              </Badge>
                            ) : isFormattedDate(key, value) ? (
                              <Badge variant="outline">
                                {formatValue(key, value)}
                              </Badge>
                            ) : (
                              <span className="text-foreground">
                                {formatValue(key, value)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={3}
                        className="text-center text-muted-foreground py-8"
                      >
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
