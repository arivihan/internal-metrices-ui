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

// @ts-ignore
export const ViewDetailsPopup = ({ open, onClose, data, title }) => {
  if (!data) return null;

  // Helper function to check if a value is an epoch timestamp
  const isEpochTimestamp = (value: any): boolean => {
    if (typeof value !== "number") return false;
    // Check if it's a reasonable timestamp (between 2000 and 2100)
    const minTimestamp = 946684800000; // Jan 1, 2000
    const maxTimestamp = 4102444800000; // Jan 1, 2100
    return value >= minTimestamp && value <= maxTimestamp;
  };

  // Helper function to check if field name suggests it's a date/time field
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

    // Only format fields with "At" suffix (createdAt, updatedAt, modifiedAt)
    const dateKeywords = [
      "createdat",
      "updatedat",
      "modifiedat",
      "deletedat",
      "publishedat",
      "scheduledat",
      "expiredat",
    ];

    return dateKeywords.includes(lowerKey);
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

  // Helper function to format values for display
  const formatValue = (key: string, value: any): string => {
    if (value === null || value === undefined) return "-";

    // Check if it's a date field with epoch timestamp
    if (isDateField(key) && isEpochTimestamp(value)) {
      return formatDate(value);
    }

    if (typeof value === "boolean") return value ? "Active" : "Inactive";
    if (Array.isArray(value)) {
      return value.length > 0 ? value.join(", ") : "-";
    }
    if (typeof value === "object") {
      return JSON.stringify(value, null, 2);
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

  // Convert object to array of key-value pairs, excluding internal fields
  const dataEntries = Object.entries(data).filter(
    ([key]) =>
      !key.startsWith("_") && // Exclude internal fields
      key !== "id" // Exclude ID from the main list (we'll show it separately)
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[60vw] max-w-[60vw] max-h-[85vh] p-0 flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogTitle className="text-xl font-semibold">
            {title || "View Details"}
          </DialogTitle>
          <DialogDescription>
            {data.id && (
              <span className="font-mono text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                ID: {data.id}
              </span>
            )}
          </DialogDescription>
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
          <div className="border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="w-[35%] font-semibold text-base">
                    Field
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
                      <TableCell className="font-medium text-muted-foreground py-4">
                        {formatFieldName(key)}
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
                            <Badge
                              
                              
                            >
                              {formatValue(key, value)}
                            </Badge>
                          ) : typeof value === "object" && value !== null ? (
                            <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-md border">
                              {formatValue(key, value)}
                            </pre>
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
                      colSpan={2}
                      className="text-center text-muted-foreground py-8"
                    >
                      No data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
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
