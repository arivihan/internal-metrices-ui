import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Plus,
  GripVertical,
  MoreVertical,
} from "lucide-react";

interface TableColumn {
  key: string;
  label: string;
  type: "string" | "number" | "currency" | "percentage" | "badge" | "status";
  sortable: boolean;
}

interface TableTab {
  id: string;
  label: string;
  count: number | null;
}

interface TableConfig {
  sortable: boolean;
  searchable: boolean;
  pagination: boolean;
  pageSize: number;
  columns: TableColumn[];
  data: Record<string, unknown>[];
}

export interface TableItem {
  id: string;
  title: string;
  allowedRoles: string[];
  tabs?: TableTab[];
  table: TableConfig;
}

function StatusBadge({ status }: { status: string }) {
  const isDone = status === "Done";
  return (
    <div className="flex items-center gap-2">
      {isDone ? (
        <span className="h-2 w-2 rounded-full bg-brand" />
      ) : (
        <span className="h-2 w-2 rounded-full border-2 border-muted-foreground/40" />
      )}
      <span className="text-sm">{status}</span>
    </div>
  );
}

interface DataTableProps {
  item: TableItem;
}

export function DataTable({ item }: DataTableProps) {
  const [activeTab, setActiveTab] = useState(item.tabs?.[0]?.id || "outline");
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const { table, tabs } = item;
  const pageSize = table.pageSize || 10;
  const totalPages = Math.ceil(table.data.length / pageSize);

  const paginatedData = table.data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const toggleAll = () => {
    if (selectedRows.size === paginatedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginatedData.map((_, i) => i)));
    }
  };

  const formatCellValue = (value: unknown, type: string): React.ReactNode => {
    if (value === null || value === undefined) return "-";

    switch (type) {
      case "currency":
        return `₹${Number(value).toLocaleString("en-IN")}`;
      case "percentage":
        return `${value}%`;
      case "number":
        return Number(value).toLocaleString("en-IN");
      case "badge":
        return (
          <span className="inline-flex rounded-md border border-border/50 bg-secondary/50 px-2.5 py-0.5 text-xs">
            {String(value)}
          </span>
        );
      case "status":
        return <StatusBadge status={String(value)} />;
      default:
        return String(value);
    }
  };

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      {/* Header with Tabs and Actions */}
      <div className="flex items-center justify-between p-4">
        {/* Tabs */}
        <div className="flex items-center rounded-lg border border-border/50 overflow-hidden">
          {tabs?.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-1.5 text-sm flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded bg-muted text-xs font-medium">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 h-9">
                <Columns3 className="h-4 w-4" />
                Customize Columns
                <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.columns.map((col) => (
                <DropdownMenuItem key={col.key}>
                  <Checkbox className="mr-2" defaultChecked />
                  {col.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border-t border-border/50">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/50">
              <TableHead className="w-12 pl-4">
                <Checkbox
                  checked={
                    selectedRows.size === paginatedData.length &&
                    paginatedData.length > 0
                  }
                  onCheckedChange={toggleAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead className="w-8"></TableHead>
              {table.columns.map((col) => (
                <TableHead
                  key={col.key}
                  className="text-muted-foreground font-medium text-sm"
                >
                  {col.label}
                </TableHead>
              ))}
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, idx) => (
              <TableRow
                key={idx}
                className="border-b border-border/30 hover:bg-muted/30"
              >
                <TableCell className="pl-4">
                  <Checkbox
                    checked={selectedRows.has(idx)}
                    onCheckedChange={() => toggleRow(idx)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 cursor-grab" />
                </TableCell>
                {table.columns.map((col) => (
                  <TableCell
                    key={col.key}
                    className={col.key === "header" ? "font-medium" : ""}
                  >
                    {formatCellValue(row[col.key], col.type)}
                  </TableCell>
                ))}
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {table.pagination && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <div className="text-sm text-muted-foreground">
            {selectedRows.size} of {table.data.length} row(s) selected.
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Rows per page</span>
              <select className="bg-transparent border border-border/50 rounded-md px-2 py-1 text-sm h-8">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            <div className="text-sm">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
