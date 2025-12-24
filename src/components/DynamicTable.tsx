import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { TableHeader as TableHeaderType } from "@/types/sidebar";

interface DynamicTableProps {
  headers: TableHeaderType[];
  data: any[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  isSearchResults: boolean;
  onPageChange: (page: number) => void;
  onRowAction: (action: any, rowData: any) => void;
  onViewJson: (data: any) => void;
}

const CellRenderer = ({ header, value, onViewJson }) => {
  if (value === undefined || value === null) return "-";

  if (header.Header === "Id") {
    const idValue = String(value);
    return (
      <div
        className={`max-w-[150px] break-all font-mono font-semibold text-primary ${
          idValue.length > 5 ? "text-xs leading-tight" : "text-sm"
        }`}
      >
        {idValue}
      </div>
    );
  }

  switch (header.type) {
    case "image":
      return (
        <div className="flex h-[10vh] w-[10vw] overflow-hidden items-center justify-center">
          <img
            src={value}
            alt="Image"
            className="w-full h-full object-cover border shadow-sm"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/64?text=No+Image";
            }}
          />
        </div>
      );

    case "text":
      if (
        typeof value === "string" &&
        (value.startsWith("{") || value.startsWith("["))
      ) {
        try {
          const parsed = JSON.parse(value);
          return (
            <Button
              variant="link"
              className="p-0 text-cyan-400 h-auto text-xs"
              onClick={() => {
                onViewJson(parsed);
              }}
            >
              View JSON
            </Button>
          );
        } catch {
          return <span className="line-clamp-2">{String(value)}</span>;
        }
      }
      return <span className="line-clamp-2">{String(value)}</span>;

    default:
      return <span className="line-clamp-2">{String(value)}</span>;
  }
};

export function DynamicTable({
  headers,
  data,
  loading,
  error,
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  isSearchResults,
  onPageChange,
  onRowAction,
  onViewJson,
}: DynamicTableProps) {
  const sortedHeaders = [...headers].sort(
    (a, b) => (a.order || 0) - (b.order || 0)
  );

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive">
        Error loading table: {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground">No data available</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {sortedHeaders.map((header, index) => (
                <TableHead key={index} className="font-semibold">
                  {header.Header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {sortedHeaders.map((header, colIndex) => (
                  <TableCell key={colIndex}>
                    {header.type === "actions" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {header.actions?.map((action, idx) => (
                            <DropdownMenuItem
                              key={idx}
                              onClick={() => onRowAction(action, row)}
                            >
                              {action.title}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <CellRenderer
                        header={header}
                        value={row[header.accessor]}
                        onViewJson={onViewJson}
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage + 1} of {totalPages} ({totalItems} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
