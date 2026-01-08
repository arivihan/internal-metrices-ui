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
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header with Dropdown Selector */}
      <div className="border-b mb-3 p-4 ">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">{dropdownSelector.label}</label>
            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger className="w-[300px]">
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
          <h2 className="text-lg font-semibold">{selectedViewConfig.title}</h2>
        </div>
      </div>

      {/* Action Buttons */}
      {selectedViewConfig.buttons && selectedViewConfig.buttons.length > 0 && (
        <div className="border-b px-4 py-3 flex items-center gap-2 flex-wrap bg-background">
          {selectedViewConfig.buttons.map((button: any, idx: number) => (
            <Button
              key={idx}
              onClick={() => onButtonClick(button, selectedView)}
              className="text-gray-200 font-medium shadow-sm transition-all duration-200"
            >
              {button.title}
            </Button>
          ))}
        </div>
      )}

      {/* Search/Filter Section */}
      {selectedViewConfig.search && (
      
          <CardContent className="px-4" >
            <div className="flex items-end gap-3 flex-nowrap overflow-x-auto pb-2">
              {selectedViewConfig.search.fields?.map(
                (field: any, fieldIndex: number) => (
                  <div key={fieldIndex} className="flex-shrink-0 min-w-max">
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">
                      {field.label}
                    </label>
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
                        <SelectTrigger className="w-40 bg-background border border-gray-300">
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
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
                        className="text-sm w-40"
                      />
                    )}
                  </div>
                )
              )}
              <Button
                onClick={() => onSearch(selectedView, "")}
                disabled={isSearching}
                className="bg-emerald-600 hover:bg-emerald-700 flex-shrink-0"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
              {Object.keys(searchData).some((k) => searchData[k]) && (
                <Button
                  onClick={() => onClear(selectedView)}
                  variant="outline"
                  className="flex-shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
      
      )}

      {/* Table Section */}
      <div className="flex-1 overflow-y-auto p-4 w-full">
        <Card className="border-0 shadow-sm h-full flex flex-col w-full">
          <CardContent className="p-0 flex-1 flex flex-col overflow-hidden w-full">
            <div className="rounded border overflow-hidden flex flex-col flex-1 w-full">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-red-600 font-semibold mb-2">Error Loading Data</p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader className="border-b sticky top-0 ">
                      <TableRow>
                        {selectedViewConfig.tableHeaders
                          ?.sort((a: any, b: any) => (a.order || 999) - (b.order || 999))
                          .map((header: any, idx: number) => (
                            <TableHead
                              key={idx}
                              className="font-semibold text-foreground "
                            >
                              {header.Header}
                            </TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.length > 0 ? (
                        data.map((row: any, rowIndex: number) => (
                          <TableRow
                            key={rowIndex}
                            className=" transition-colors"
                          >
                            {selectedViewConfig.tableHeaders
                              ?.sort((a: any, b: any) => (a.order || 999) - (b.order || 999))
                              .map((header: any, colIndex: number) => (
                                <TableCell key={colIndex} className="text-sm">
                                  {header.type === "actions" ? (
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm">
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
                        <TableRow>
                          <TableCell
                            colSpan={selectedViewConfig.tableHeaders?.length || 1}
                            className="h-24 text-center py-8"
                          >
                            <div className="text-sm">
                              <p className="text-muted-foreground font-medium">
                                No data available
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                No {selectedViewConfig.title?.toLowerCase()} records found
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {paginationData && (
                    <div className="border-t px-4 py-4  flex items-center justify-between text-sm">
                      <div className="text-muted-foreground">
                        Showing{" "}
                        {Math.min(
                          paginationData.currentPage * paginationData.pageSize + 1,
                          paginationData.totalElements
                        )}{" "}
                        to{" "}
                        {Math.min(
                          (paginationData.currentPage + 1) * paginationData.pageSize,
                          paginationData.totalElements
                        )}{" "}
                        of {paginationData.totalElements} results
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            onPageChange(
                              selectedView,
                              Math.max(0, paginationData.currentPage - 1)
                            )
                          }
                          disabled={paginationData.currentPage === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="text-sm font-medium px-2">
                          Page {paginationData.currentPage + 1} of {paginationData.totalPages}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
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
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
