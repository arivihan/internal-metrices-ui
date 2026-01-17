import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { DynamicIcon } from "@/lib/icon-map";
import { Skeleton } from "@/components/ui/skeleton";

interface TabsViewerProps {
  tabs: any[];
  activeTab: string;
  tabsData: Record<string, any[]>;
  loadingTabs: Record<string, boolean>;
  tabErrors: Record<string, string>;
  title: string;
  onTabChange: (
    tabId: string,
    getDataUrl: string,
    page?: number
  ) => Promise<void>;
  onRowAction: (action: any, rowData: any) => void;
  onButtonClick: (button: any) => void;
  onViewJson: (data: any) => void;
  CellRenderer: React.ComponentType<any>;
  searchData?: Record<string, any>;
  onSearchDataChange?: (data: Record<string, any>) => void;
  onSearch?: () => Promise<void>;
  onClear?: () => void;
  isSearching?: boolean;
  tabPagination?: Record<
    string,
    {
      currentPage: number;
      totalPages: number;
      pageSize: number;
      totalItems: number;
    }
  >;
  onPageChange?: (tabId: string, page: number) => void;
}

export const TabsViewer: React.FC<TabsViewerProps> = ({
  tabs,
  activeTab,
  tabsData,
  loadingTabs,
  tabErrors,
  onTabChange,
  onRowAction,
  onButtonClick,
  onViewJson,
  CellRenderer,
  searchData = {},
  onSearchDataChange,
  onSearch,
  onClear,
  isSearching = false,
  tabPagination = {},
  onPageChange,
}) => {
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>(
    {}
  );
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>(
    {}
  );
  const defaultTabId = tabs?.[0]?.tabId ?? "";

  // Fetch dropdown options for search fields
  useEffect(() => {
    if (!tabs || tabs.length === 0) return;

    tabs.forEach((tab: any) => {
      if (!tab.search?.fields) return;

      tab.search.fields.forEach(async (field: any) => {
        if (field.type === "select" && field.fetchOptionsUrl) {
          setLoadingOptions((prev) => ({ ...prev, [field.value]: true }));
          try {
            const { dynamicRequest } = await import("@/services/apiClient");
            const response: any = await dynamicRequest(
              field.fetchOptionsUrl,
              "GET"
            );

            let options = [];
            if (
              (response as any)?.data &&
              Array.isArray((response as any).data)
            ) {
              options = (response as any).data;
            } else if (Array.isArray(response)) {
              options = response;
            }

            const transformedOptions = options.map((opt: any) => ({
              value: opt[field.optionValueKey] || opt.id,
              label: opt[field.optionLabelKey] || opt.name || String(opt),
            }));

            setDropdownOptions((prev) => ({
              ...prev,
              [field.value]: transformedOptions,
            }));
          } catch (error) {
            console.error(`Failed to fetch options for ${field.value}:`, error);
          } finally {
            setLoadingOptions((prev) => ({ ...prev, [field.value]: false }));
          }
        }
      });
    });
  }, [tabs]);

  console.log(`[TabsViewer] 🎨 Rendering with:`, {
    tabCount: tabs?.length,
    activeTab,
    defaultTabId,
    tabsData: Object.keys(tabsData).length,
    tabs: tabs?.map((t: any) => t.tabId),
  });

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header Section */}

      {/* Tabs Section */}
      <div className="flex-1 overflow-hidden flex flex-col w-full">
        <Tabs
          value={activeTab || defaultTabId}
          onValueChange={async (tabId) => {
            const tab = tabs.find((t: any) => t.tabId === tabId);
            if (tab) {
              await onTabChange(tab.tabId, tab.getDataUrl);
            }
          }}
          className="flex flex-col h-full w-full"
        >
          {/* Tab List - Professional Styling */}
          <div className="border-b">
            <TabsList className="w-full justify-start h-auto bg-transparent p-0 rounded-none space-x-1 px-2">
              {tabs.map((tab: any) => (
                <TabsTrigger
                  key={tab.tabId}
                  value={tab.tabId}
                  className="relative px-4 py-3 rounded-none border-b-2 border-b-transparent text-sm font-medium transition-all duration-200 data-[state=active]:border-b-emerald-500 data-[state=active]:text-emerald-700 data-[state=inactive]:text-muted-foreground hover:text-slate-700"
                >
                  {tab.icon && (
                    <DynamicIcon
                      name={tab.icon}
                      className="mr-2 h-4 w-4 shrink-0"
                    />
                  )}
                  <span className="truncate">
                    {tab.tabTitle || tab.title || "Mapping"}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto">
            {tabs.map((tab: any) => (
              <TabsContent
                key={tab.tabId}
                value={tab.tabId}
                className="m-0 p-0 h-full flex flex-col"
              >
                {loadingTabs[tab.tabId] ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Loading {tab.tabTitle || tab.title || "mapping"}...
                      </p>
                    </div>
                  </div>
                ) : tabErrors[tab.tabId] ? (
                  <div className="flex h-full items-center justify-center p-6">
                    <div className="text-center max-w-md">
                      <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                        <svg
                          className="h-6 w-6 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4v2m0-10a9 9 0 110 18 9 9 0 010-18z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Something went wrong
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Failed to load{" "}
                        {(tab.tabTitle || tab.title || "mapping").toLowerCase()}{" "}
                        data
                      </p>
                      <p className="text-xs text-red-600 font-mono bg-red-50 rounded px-3 py-2 mb-4">
                        {tabErrors[tab.tabId]}
                      </p>
                      <Button
                        onClick={() => onTabChange(tab.tabId, tab.getDataUrl)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 overflow-hidden">
                    {/* Action Buttons Section */}
                    {tab.buttons && tab.buttons.length > 0 && (
                      <div className="border-b  px-4 py-3 flex items-center gap-2 flex-wrap">
                        {tab.buttons.map((button: any, btnIndex: number) => (
                          <Button
                            key={btnIndex}
                            onClick={() => onButtonClick(button)}
                            className=" text-gray-200 font-medium shadow-sm transition-all duration-200"
                          >
                            {button.title}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Search/Filter Section */}
                    {tab.search?.fields && tab.search.fields.length > 0 && (
                      <Card className="shadow-none p-2">
                        <CardContent>
                          <div className="flex gap-2 flex-wrap items-end">
                            {tab.search.fields.map(
                              (field: any, fieldIndex: number) => (
                                <div key={fieldIndex} className="flex">
                                  {field.type === "select" ? (
                                    <Select
                                      value={searchData[field.value] || ""}
                                      onValueChange={(value) =>
                                        onSearchDataChange?.({
                                          ...searchData,
                                          [field.value]: value,
                                        })
                                      }
                                      disabled={loadingOptions[field.value]}
                                    >
                                      <SelectTrigger>
                                        <SelectValue
                                          placeholder={field.placeholder}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {loadingOptions[field.value] ? (
                                          <div className="p-2 text-center text-sm text-muted-foreground">
                                            Loading...
                                          </div>
                                        ) : (dropdownOptions[field.value] || [])
                                          .length > 0 ? (
                                          (
                                            dropdownOptions[field.value] || []
                                          ).map((option, idx) => (
                                            <SelectItem
                                              key={idx}
                                              value={String(option.value)}
                                            >
                                              {option.label}
                                            </SelectItem>
                                          ))
                                        ) : field.selectOptions?.length > 0 ? (
                                          field.selectOptions
                                            .filter(
                                              (option: any) =>
                                                option.value !== ""
                                            )
                                            .map((option: any, idx: number) => (
                                              <SelectItem
                                                key={idx}
                                                value={option.value}
                                              >
                                                {option.label}
                                              </SelectItem>
                                            ))
                                        ) : (
                                          <div className="p-2 text-center text-sm text-muted-foreground">
                                            No options available
                                          </div>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  ) : (
                                    <Input
                                      type={field.type || "text"}
                                      placeholder={field.placeholder}
                                      value={searchData[field.value] || ""}
                                      onChange={(e) =>
                                        onSearchDataChange?.({
                                          ...searchData,
                                          [field.value]: e.target.value,
                                        })
                                      }
                                    />
                                  )}
                                </div>
                              )
                            )}
                            <Button
                              onClick={onSearch}
                              disabled={isSearching}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                            >
                              {isSearching ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Searching...
                                </>
                              ) : (
                                tab.search.searchBtnText || "Search"
                              )}
                            </Button>
                            {Object.values(searchData).some(
                              (val) =>
                                val !== "" && val !== null && val !== undefined
                            ) && (
                                <Button
                                  variant="outline"
                                  onClick={onClear}
                                  className="text-slate-700 font-medium"
                                >
                                  Clear
                                </Button>
                              )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Table Section */}
                    <div className="rounded-lg border bg-card">
                      {loadingTabs[tab.tabId] ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              {tab.tableHeaders
                                ?.sort(
                                  (a: any, b: any) =>
                                    (a.order || 999) - (b.order || 999)
                                )
                                .map((header: any, index: number) => (
                                  <TableHead
                                    key={index}
                                    className="font-semibold text-foreground"
                                  >
                                    {header.Header}
                                  </TableHead>
                                ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {[...Array(10)].map((_: any, i: number) => (
                              <TableRow key={i}>
                                {tab.tableHeaders?.map((_: any, j: number) => (
                                  <TableCell key={j}>
                                    <Skeleton className="h-4 w-full" />
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                {tab.tableHeaders
                                  ?.sort(
                                    (a: any, b: any) =>
                                      (a.order || 999) - (b.order || 999)
                                  )
                                  .map((header: any, index: number) => (
                                    <TableHead
                                      key={index}
                                      className="font-semibold text-foreground"
                                    >
                                      {header.Header}
                                    </TableHead>
                                  ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {isSearching ? (
                                <TableRow>
                                  <TableCell
                                    colSpan={tab.tableHeaders?.length || 1}
                                    className="h-24 text-center"
                                  >
                                    <div className="flex items-center justify-center">
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      <p className="text-muted-foreground">
                                        Searching...
                                      </p>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ) : tabsData[tab.tabId] &&
                                tabsData[tab.tabId].length > 0 ? (
                                tabsData[tab.tabId].map(
                                  (row: any, rowIndex: number) => (
                                    <TableRow
                                      key={rowIndex}
                                      className="transition-colors"
                                    >
                                      {tab.tableHeaders
                                        ?.sort(
                                          (a: any, b: any) =>
                                            (a.order || 999) - (b.order || 999)
                                        )
                                        .map(
                                          (header: any, colIndex: number) => {
                                            if (
                                              header.type === "actions" &&
                                              header.actions
                                            ) {
                                              return (
                                                <TableCell
                                                  key={colIndex}
                                                  className="text-sm"
                                                >
                                                  <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                      asChild
                                                    >
                                                      <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                      >
                                                        <MoreVertical className="h-4 w-4" />
                                                      </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                      {header.actions.map(
                                                        (
                                                          action: any,
                                                          actionIndex: number
                                                        ) => (
                                                          <DropdownMenuItem
                                                            key={actionIndex}
                                                            onClick={() =>
                                                              onRowAction(
                                                                action,
                                                                row
                                                              )
                                                            }
                                                          >
                                                            {action.title}
                                                          </DropdownMenuItem>
                                                        )
                                                      )}
                                                    </DropdownMenuContent>
                                                  </DropdownMenu>
                                                </TableCell>
                                              );
                                            }
                                            return (
                                              <TableCell
                                                key={colIndex}
                                                className="text-sm"
                                              >
                                                <CellRenderer
                                                  header={header}
                                                  value={row[header.accessor]}
                                                  onViewJson={onViewJson}
                                                  rowData={row}
                                                />
                                              </TableCell>
                                            );
                                          }
                                        )}
                                    </TableRow>
                                  )
                                )
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={tab.tableHeaders?.length || 1}
                                    className="h-24 text-center text-muted-foreground"
                                  >
                                    No data available
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>

                          {/* Pagination */}
                          {tabPagination[tab.tabId] &&
                            tabPagination[tab.tabId].totalItems > 0 && (
                              <div className="flex items-center justify-between border-t px-4 py-3">
                                <p className="text-sm text-muted-foreground">
                                  {tabPagination[tab.tabId].totalItems} items
                                </p>
                                {tabPagination[tab.tabId].totalPages > 1 && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground">
                                      Page{" "}
                                      {tabPagination[tab.tabId].currentPage + 1}{" "}
                                      of {tabPagination[tab.tabId].totalPages}
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() =>
                                          onPageChange?.(
                                            tab.tabId,
                                            Math.max(
                                              0,
                                              tabPagination[tab.tabId]
                                                .currentPage - 1
                                            )
                                          )
                                        }
                                        disabled={
                                          tabPagination[tab.tabId]
                                            .currentPage === 0
                                        }
                                      >
                                        <ChevronLeft className="size-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="size-8"
                                        onClick={() =>
                                          onPageChange?.(
                                            tab.tabId,
                                            Math.min(
                                              tabPagination[tab.tabId]
                                                .totalPages - 1,
                                              tabPagination[tab.tabId]
                                                .currentPage + 1
                                            )
                                          )
                                        }
                                        disabled={
                                          tabPagination[tab.tabId]
                                            .currentPage >=
                                          tabPagination[tab.tabId].totalPages -
                                          1
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
                )}
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};
