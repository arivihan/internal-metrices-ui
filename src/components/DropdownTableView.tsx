import React, { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { DynamicIcon } from "@/lib/icon-map";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownSelector {
  label: string;
  selectOptions: DropdownOption[];
}

interface ViewConfig {
  title?: string;
  description?: string;
  icon?: string;
  buttons?: any[];
  getDataUrl: string;
  search?: any;
  tableHeaders?: any[];
}

interface DropdownTableViewProps {
  dropdownSelector: DropdownSelector;
  views: Record<string, ViewConfig>;
  onTabChange: (tabId: string, getDataUrl: string, page?: number) => void;
  onRowAction: (action: string, id: string, tabId: string) => void;
  onButtonClick: (buttonData: any, tabId: string) => void;
  onViewJson: (data: any) => void;
  CellRenderer: React.ComponentType<any>;
  tabPagination: Record<string, any>;
  onPageChange: (tabId: string, page: number) => void;
  tabsData: Record<string, any[]>;
  loadingTabs: Record<string, boolean>;
  tabErrors: Record<string, string | null>;
  searchData: Record<string, any>;
  onSearchDataChange: (data: Record<string, any>) => void;
  onSearch: (tabId: string, searchValue: string) => void;
  onClear: (tabId: string) => void;
  isSearching: boolean;
}

export const DropdownTableView: React.FC<DropdownTableViewProps> = ({
  dropdownSelector,
  views,
  onTabChange,
  onRowAction,
  onButtonClick,
  onViewJson,
  CellRenderer,
  tabPagination,
  onPageChange,
  tabsData,
  loadingTabs,
  tabErrors,
  searchData,
  onSearchDataChange,
  onSearch,
  onClear,
  isSearching,
}) => {
  const [selectedView, setSelectedView] = useState<string>(
    dropdownSelector.selectOptions[0]?.value || ""
  );

  const selectedViewConfig = views[selectedView];

  // Fetch data when selected view changes
  useEffect(() => {
    if (selectedView && selectedViewConfig?.getDataUrl) {
      console.log(
        `[DropdownTableView] Fetching data for ${selectedView} from ${selectedViewConfig.getDataUrl}`
      );
      onTabChange(selectedView, selectedViewConfig.getDataUrl, 0);
    }
  }, [selectedView]);

  if (!selectedViewConfig) {
    return (
      <div className="p-4 text-red-500">
        No view configuration found for "{selectedView}"
      </div>
    );
  }

  const data = tabsData[selectedView] || [];
  const loading = loadingTabs[selectedView] || false;
  const error = tabErrors[selectedView];
  const pagination = tabPagination[selectedView] || {};

  // Ensure pagination has required properties with defaults
  const paginationData = {
    currentPage: pagination?.currentPage ?? 0,
    pageSize: pagination?.pageSize ?? 10,
    totalElements: pagination?.totalElements ?? data.length,
    totalPages: pagination?.totalPages ?? Math.ceil((pagination?.totalElements ?? data.length) / (pagination?.pageSize ?? 10)),
  };

  return (
    <div className="w-full h-full flex flex-col bg-background  space-y-3">
      {/* Header Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {dropdownSelector.label}
            </label>
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-[300px] bg-background">
                <SelectValue placeholder="Select a mapping type" />
              </SelectTrigger>
              <SelectContent>
                {dropdownSelector.selectOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {selectedViewConfig.title}
          </h2>
        </div>

        {/* Action Buttons */}
        {selectedViewConfig.buttons && selectedViewConfig.buttons.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {selectedViewConfig.buttons.map((button: any, idx: number) => (
              <Button
                key={idx}
                onClick={() => onButtonClick(button, selectedView)}
                className="font-medium shadow-sm transition-all duration-200"
              >
                {button.title}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Search/Filter Section */}
      {selectedViewConfig.search && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            {Object.keys(searchData).some((k) => searchData[k]) && (
              <Button
                onClick={() => onClear(selectedView)}
                variant="ghost"
                size="sm"
                className="h-7 text-xs ml-auto"
              >
                Clear All
              </Button>
            )}
          </div>
          <div className="flex items-end gap-3 flex-wrap">
            {selectedViewConfig.search.fields?.map(
              (field: any, fieldIndex: number) => (
                <div key={fieldIndex} className="space-y-1.5">
                  
                  {field.type === "select" ? (
                    <Select
                      value={searchData[field.value] || ""}
                      onValueChange={(value) =>
                        onSearchDataChange({
                          ...searchData,
                          [field.value]: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-40 h-9 bg-background">
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.selectOptions?.map((opt: any) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={searchData[field.value] || ""}
                      onChange={(e) =>
                        onSearchDataChange({
                          ...searchData,
                          [field.value]: e.target.value,
                        })
                      }
                      className="text-sm w-40 h-9 bg-background"
                    />
                  )}
                </div>
              )
            )}
            <Button
              onClick={() => onSearch(selectedView, "")}
              disabled={isSearching}
              size="sm"
              className="h-9 gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Searching
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="flex-1 rounded-lg border bg-card overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex flex-col overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  {selectedViewConfig.tableHeaders
                    ?.sort((a: any, b: any) => (a.order || 999) - (b.order || 999))
                    .map((header: any, idx: number) => (
                      <TableHead
                        key={idx}
                        className="font-semibold text-foreground py-3"
                      >
                        {header.Header}
                      </TableHead>
                    ))}
                </TableRow>
              </TableHeader>
            </Table>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableBody>
                  {[...Array(10)].map((_: any, i: number) => (
                    <TableRow key={i} className="border-b hover:bg-transparent">
                      {selectedViewConfig.tableHeaders?.map(
                        (_: any, j: number) => (
                          <TableCell key={j} className="py-3">
                            <Skeleton className="h-3 w-full" />
                          </TableCell>
                        )
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-destructive font-medium">{error}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card border-b">
                  <TableRow>
                    {selectedViewConfig.tableHeaders
                      ?.sort((a: any, b: any) => (a.order || 999) - (b.order || 999))
                      .map((header: any, idx: number) => (
                        <TableHead
                          key={idx}
                          className="font-semibold text-foreground py-3"
                        >
                          {header.Header}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isSearching ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={selectedViewConfig.tableHeaders?.length || 1}
                        className="h-32 text-center"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <p className="text-muted-foreground text-sm">
                            Searching...
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : data.length > 0 ? (
                    data.map((row: any, rowIndex: number) => (
                      <TableRow
                        key={rowIndex}
                        className="border-b transition-colors hover:bg-accent/5"
                      >
                        {selectedViewConfig.tableHeaders
                          ?.sort((a: any, b: any) => (a.order || 999) - (b.order || 999))
                          .map((header: any, colIndex: number) => (
                            <TableCell key={colIndex} className="text-sm py-3">
                              {header.type === "actions" ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {header.actions?.map((action: any, aIdx: number) => (
                                      <DropdownMenuItem
                                        key={aIdx}
                                        onClick={() =>
                                          onRowAction(action, row.id, selectedView)
                                        }
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
                                  onViewJson={() => onViewJson(row)}
                                  rowData={row}
                                />
                              )}
                            </TableCell>
                          ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={selectedViewConfig.tableHeaders?.length || 1}
                        className="h-32 text-center text-muted-foreground"
                      >
                        <p className="text-sm">No data available</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Footer */}
            {paginationData && (
              <div className="border-t bg-card/50 px-4 py-3 flex items-center justify-between mt-auto">
                <p className="text-xs text-muted-foreground font-medium">
                  {paginationData.totalElements} items
                </p>
                {paginationData.totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">
                      Page {paginationData.currentPage + 1} of {paginationData.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 h-8 w-8"
                        onClick={() =>
                          onPageChange(
                            selectedView,
                            Math.max(0, paginationData.currentPage - 1)
                          )
                        }
                        disabled={paginationData.currentPage === 0}
                      >
                        <ChevronLeft className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 h-8 w-8"
                        onClick={() =>
                          onPageChange(
                            selectedView,
                            Math.min(
                              paginationData.totalPages - 1,
                              paginationData.currentPage + 1
                            )
                          )
                        }
                        disabled={
                          paginationData.currentPage >= paginationData.totalPages - 1
                        }
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
