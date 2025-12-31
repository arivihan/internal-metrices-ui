import React from "react";
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
import { Button } from "@/components/ui/button";
import { Loader2, MoreVertical } from "lucide-react";
import { DynamicIcon } from "@/lib/icon-map";

interface TabsViewerProps {
  tabs: any[];
  activeTab: string;
  tabsData: Record<string, any[]>;
  loadingTabs: Record<string, boolean>;
  tabErrors: Record<string, string>;
  title: string;
  onTabChange: (tabId: string, getDataUrl: string) => Promise<void>;
  onRowAction: (action: any, rowData: any) => void;
  onButtonClick: (button: any) => void;
  onViewJson: (data: any) => void;
  CellRenderer: React.ComponentType<any>;
}

export const TabsViewer: React.FC<TabsViewerProps> = ({
  tabs,
  activeTab,
  tabsData,
  loadingTabs,
  tabErrors,
  title,
  onTabChange,
  onRowAction,
  onButtonClick,
  onViewJson,
  CellRenderer,
}) => {
  const defaultTabId = tabs?.[0]?.tabId ?? "";
  
  console.log(`[TabsViewer] 🎨 Rendering with:`, {
    tabCount: tabs?.length,
    activeTab,
    defaultTabId,
    tabsData: Object.keys(tabsData).length,
    tabs: tabs?.map(t => t.tabId)
  });

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Header Section */}

      {/* Tabs Section */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <Tabs
          value={activeTab || defaultTabId}
          onValueChange={async (tabId) => {
            const tab = tabs.find((t: any) => t.tabId === tabId);
            if (tab) {
              await onTabChange(tab.tabId, tab.getDataUrl);
            }
          }}
          className="flex flex-col h-full"
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
                      className="mr-2 h-4 w-4 flex-shrink-0"
                    />
                  )}
                  <span className="truncate">{tab.tabTitle}</span>
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
                        Loading {tab.tabTitle}...
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
                        Failed to load {tab.tabTitle.toLowerCase()} data
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition-all duration-200"
                          >
                            {button.title}
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Table Section */}
                    <div className="flex-1 overflow-y-auto p-2">
                      <Card className="border-0 shadow-sm h-full flex flex-col">
                        <CardContent className="p-0 flex-1 flex flex-col overflow-hidden">
                          <div className="rounded border overflow-hidden flex flex-col flex-1">
                            <Table>
                              <TableHeader className="border-b  sticky top-0">
                                <TableRow>
                                  {tab.tableHeaders
                                    ?.sort(
                                      (a: any, b: any) =>
                                        (a.order || 999) - (b.order || 999)
                                    )
                                    .map((header: any, index: number) => (
                                      <TableHead
                                        key={index}
                                        className="font-semibold text-xs uppercase tracking-wider text-muted-foreground "
                                      >
                                        {header.Header}
                                      </TableHead>
                                    ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {tabsData[tab.tabId] &&
                                tabsData[tab.tabId].length > 0 ? (
                                  tabsData[tab.tabId].map(
                                    (row: any, rowIndex: number) => (
                                      <TableRow
                                        key={rowIndex}
                                        className="border-b transition-colors duration-150"
                                      >
                                        {tab.tableHeaders
                                          ?.sort(
                                            (a: any, b: any) =>
                                              (a.order || 999) -
                                              (b.order || 999)
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
                                                    className="py-3 px-4"
                                                  >
                                                    <DropdownMenu>
                                                      <DropdownMenuTrigger
                                                        asChild
                                                      >
                                                        <Button
                                                          variant="ghost"
                                                          size="sm"
                                                          className="h-8 w-8 p-0 hover:bg-emerald-100 transition-colors"
                                                        >
                                                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                        </Button>
                                                      </DropdownMenuTrigger>
                                                      <DropdownMenuContent
                                                        align="end"
                                                        className="w-48"
                                                      >
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
                                                              className="cursor-pointer"
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
                                                  className="py-3 px-4"
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
                                      className="h-24 text-center py-8"
                                    >
                                      <div className="text-sm">
                                        <p className="text-muted-foreground font-medium">
                                          No data available
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          There are no{" "}
                                          {tab.tabTitle.toLowerCase()} mappings
                                          yet.
                                        </p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>
                        </CardContent>
                      </Card>
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
