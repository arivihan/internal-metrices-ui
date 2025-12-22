import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { MoreVertical, ChevronLeft, ChevronRight } from "lucide-react";
import { DynamicIcon } from "@/lib/icon-map";
import { useSignals } from "@preact/signals-react/runtime";
import {
  currentContentItem,
  layoutData,
  layoutLoading,
  layoutError,
  tableData,
  tableDataLoading,
  tableDataError,
  fetchLayoutData,
  popupOpen,
  currentPopupButton,
  openPopup,
  closePopup,
} from "@/signals/dynamicContent";

const BASE_URL = "/api";

// Helper function to render cell content based on type
const renderCellContent = (header: any, value: any) => {
  if (value === undefined || value === null) return "-";

  switch (header.type) {
    case "image":
      return (
        <div className="flex h-[10vh] w-[10vw] overflow-hidden items-center justify-center ">
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
      // Special handling for ID column based on Header name
      if (header.Header === "Id") {
        const idValue = String(value);
        // Wrap ID if longer than 5 characters
        if (idValue.length > 5) {
          return (
            <div className="max-w-[100px] break-all text-xs font-mono font-semibold text-primary">
              {idValue}
            </div>
          );
        }
        return (
          <span className="font-mono text-sm font-semibold text-primary">
            {idValue}
          </span>
        );
      }

      // Check if the value looks like JSON
      if (
        typeof value === "string" &&
        (value.startsWith("{") || value.startsWith("["))
      ) {
        try {
          const parsed = JSON.parse(value);
          return (
            <div className="max-w-xs">
              <details className="cursor-pointer">
                <summary className="text-xs text-cyan-600 hover:text-cyan-800">
                  View JSON
                </summary>
                <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                  {JSON.stringify(parsed, null, 2)}
                </pre>
              </details>
            </div>
          );
        } catch {
          // Not valid JSON, show as text
          return <span className="line-clamp-2">{String(value)}</span>;
        }
      }
      return <span className="line-clamp-2">{String(value)}</span>;

    default:
      return <span className="line-clamp-2">{String(value)}</span>;
  }
};

export default function DynamicContent() {
  useSignals();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [searchData, setSearchData] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);

  // Reset search and pagination when content item changes
  useEffect(() => {
    setSearchData({});
    setSearchResults(null);
    setCurrentPage(0);
  }, [currentContentItem.value?.title]);

  // Reset to page 0 when search changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchData]);

  // Determine which data to display
  const displayData =
    searchResults !== null ? searchResults : tableData.value || [];

  const handleButtonClick = (button: any) => {
    if (button.type === "SHOW_POPUP" && button.popupFields) {
      openPopup(button);
      setFormData({});
    } else if (button.action === "link") {
      console.log("Navigate to:", button.actionUrl);
    } else if (button.action === "download") {
      console.log("Download from:", button.actionUrl);
    }
  };

  const handleRowAction = (action: any, rowData: any) => {
    if (action.type === "SHOW_POPUP" && action.popupFields) {
      openPopup(action);
      // Pre-populate form with row data
      const initialData: Record<string, any> = {};
      action.popupFields.forEach((field: any) => {
        if (rowData[field.value]) {
          initialData[field.value] = rowData[field.value];
        }
      });
      setFormData(initialData);
    }
  };

  const handlePopupSubmit = async () => {
    if (!currentPopupButton.value) return;

    console.log("Form submitted:", {
      url:
        currentPopupButton.value.popupSubmitUrl ||
        currentPopupButton.value.actionUrl,
      data: formData,
    });

    // TODO: Call API to submit form data
    // await submitFormData(currentPopupButton.value.popupSubmitUrl!, formData)

    closePopup();
    setFormData({});
  };

  const handleSearch = async () => {
    const layout = layoutData.value;
    if (!layout?.search?.searchActionUrl) {
      console.log("❌ No search action URL configured");
      return;
    }

    // Build query parameters from search data
    const params = new URLSearchParams();

    // Add level and pagination params (required by API)
    params.append("level", "SYSTEM");
    params.append("pageNo", "0");
    params.append("pageSize", "10");

    // Add ALL search fields from the layout configuration, even if empty
    // This ensures the API receives all expected parameters
    if (layout.search.fields) {
      layout.search.fields.forEach((field: any) => {
        const value = searchData[field.value];
        // Always append the field, even if empty
        params.append(field.value, value || "");
      });
    }

    const searchUrl = `${BASE_URL}${
      layout.search.searchActionUrl
    }/all?${params.toString()}`;

    console.log("🔍 Searching with URL:", searchUrl);
    console.log("📝 Search params:", Object.fromEntries(params));

    setIsSearching(true);

    try {
      const response = await fetch(searchUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      });

      console.log("📡 Response status:", response.status);
      console.log(
        "📡 Response headers:",
        Object.fromEntries(response.headers.entries())
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Error response body:", errorText);
        throw new Error(
          `Search failed: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("✅ Search results:", data);

      // Handle different response structures
      let results = [];
      if (Array.isArray(data)) {
        results = data;
      } else if (data.content && Array.isArray(data.content)) {
        results = data.content;
      } else if (data.data && Array.isArray(data.data)) {
        results = data.data;
      } else if (data.results && Array.isArray(data.results)) {
        results = data.results;
      }

      setSearchResults(results);
      setCurrentPage(0);
      console.log(`✅ Found ${results.length} results`);
    } catch (error) {
      console.error("❌ Search error:", error);
      console.error("❌ Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        url: searchUrl,
        params: Object.fromEntries(params),
      });
      setSearchResults([]);
      // Show error to user
      alert(
        `Search failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }. Check console for details.`
      );
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    console.log("🧹 Clearing search");
    setSearchData({});
    setSearchResults(null);
    setCurrentPage(0);
  };

  if (layoutLoading.value || tableDataLoading.value) {
    console.log("⏳ Loading data...");
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentContentItem.value) {
    console.log("⏳ Waiting for sidebar click...", {
      currentContentItem: currentContentItem.value,
    });
    return (
      <Card className="m-6">
        <CardHeader>
          <CardTitle>Select an Item</CardTitle>
          <CardDescription>
            Please select an item from the sidebar to view its details
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  console.log("✅ Rendering content for:", currentContentItem.value.title);
  console.log("📋 layoutData:", layoutData.value);
  console.log("📊 tableData:", tableData.value);

  const layout = layoutData.value;

  if (!layout) {
    console.log("⏳ Waiting for layout data...");
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const totalPages = Math.ceil(displayData.length / pageSize);
  const paginatedData = displayData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  );

  const hasSearchCriteria = Object.values(searchData).some(
    (val) => val !== "" && val !== null && val !== undefined
  );

  return (
    <div className="flex flex-col h-full">
      {/* Form Popup Dialog */}
      <Dialog open={popupOpen.value} onOpenChange={closePopup}>
        <DialogContent className="max-w-2xl h-[80vh] p-0 flex flex-col">
          <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <DialogTitle>
              {currentPopupButton.value?.popupTitle || "Form"}
            </DialogTitle>
            <DialogDescription>Fill in the details below</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="grid gap-4">
              {currentPopupButton.value?.popupFields?.map((field, index) => (
                <div key={index} className="grid gap-2">
                  <Label htmlFor={field.value}>{field.label}</Label>

                  {field.type === "select" ? (
                    <Select
                      value={formData[field.value] || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, [field.value]: value })
                      }
                    >
                      <SelectTrigger id={field.value}>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.selectOptions?.map((option, idx) => (
                          <SelectItem key={idx} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id={field.value}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={formData[field.value] || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.value]: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePopup}>
              Cancel
            </Button>
            <Button onClick={handlePopupSubmit}>
              {currentPopupButton.value?.popupSubmitText || "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Header Section */}
      <div className="flex items-center justify-between border-b py-4 bg-background">
        {/* Search Section */}
        {layout?.searchable && layout?.search && (
          <CardContent>
            <div className="flex gap-2">
              {layout.search.fields.map((field: any, index: number) => (
                <div key={index} className="flex-1">
                  {field.type === "select" ? (
                    <Select
                      value={searchData[field.value] || ""}
                      onValueChange={(value) => {
                        console.log(
                          `📝 Select field "${field.value}" changed to:`,
                          value
                        );
                        setSearchData({ ...searchData, [field.value]: value });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.selectOptions?.map(
                          (option: any, idx: number) => (
                            <SelectItem key={idx} value={option.value}>
                              {option.label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={searchData[field.value] || ""}
                      onChange={(e) => {
                        console.log(
                          `📝 Input field "${field.value}" changed to:`,
                          e.target.value
                        );
                        setSearchData({
                          ...searchData,
                          [field.value]: e.target.value,
                        });
                      }}
                    />
                  )}
                </div>
              ))}
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching
                  ? "Searching..."
                  : layout.search.searchBtnText || "Search"}
              </Button>
              {hasSearchCriteria && (
                <Button variant="outline" onClick={clearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        )}

        {/* Buttons from layout config */}
        {layout?.buttons && layout.buttons.length > 0 && (
          <div className="flex gap-2 px-6">
            {layout.buttons.map((button: any, index: number) => (
              <Button
                key={index}
                variant={button.type === "icon" ? "outline" : "default"}
                size={button.type === "icon" ? "icon" : "default"}
                onClick={() => handleButtonClick(button)}
              >
                {button.icon && (
                  <DynamicIcon
                    name={button.icon}
                    className={`h-4 w-4 ${
                      button.type !== "icon" ? "mr-2" : ""
                    }`}
                  />
                )}
                {button.type !== "icon" && button.title}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto w-full space-y-6">
        {/* Error Display */}
        {layoutError.value && (
          <Card className="m-6">
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive">{layoutError.value}</p>
            </CardContent>
          </Card>
        )}

        {/* Table Section */}
        {layout?.tableHeaders && layout.tableHeaders.length > 0 && (
          <Card className="m-6">
            <CardHeader>
              {/* <CardTitle>Data Table</CardTitle>
              <CardDescription>View and manage records</CardDescription> */}
            </CardHeader>
            <CardContent>
              <div className="border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {layout.tableHeaders
                        .sort(
                          (a: any, b: any) =>
                            (a.order || 999) - (b.order || 999)
                        )
                        .map((header: any, index: number) => (
                          <th
                            key={index}
                            className="px-4 py-3 text-left font-medium"
                          >
                            {header.Header}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isSearching ? (
                      <tr>
                        <td
                          colSpan={layout.tableHeaders.length}
                          className="p-8 text-center"
                        >
                          <p className="text-muted-foreground">Searching...</p>
                        </td>
                      </tr>
                    ) : tableDataLoading.value ? (
                      <tr>
                        <td
                          colSpan={layout.tableHeaders.length}
                          className="p-8 text-center"
                        >
                          <p className="text-muted-foreground">
                            Loading table data...
                          </p>
                        </td>
                      </tr>
                    ) : tableDataError.value ? (
                      <tr>
                        <td
                          colSpan={layout.tableHeaders.length}
                          className="p-8 text-center text-destructive"
                        >
                          <p>{tableDataError.value}</p>
                        </td>
                      </tr>
                    ) : paginatedData && paginatedData.length > 0 ? (
                      paginatedData.map((row: any, rowIndex: number) => (
                        <tr
                          key={rowIndex}
                          className="border-b hover:bg-muted/50"
                        >
                          {layout.tableHeaders
                            .sort(
                              (a: any, b: any) =>
                                (a.order || 999) - (b.order || 999)
                            )
                            .map((header: any, colIndex: number) => {
                              // Handle action columns
                              if (header.type === "actions" && header.actions) {
                                return (
                                  <td key={colIndex} className="px-4 py-3">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
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
                                                handleRowAction(action, row)
                                              }
                                            >
                                              {action.title}
                                            </DropdownMenuItem>
                                          )
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </td>
                                );
                              }
                              // Regular data columns
                              return (
                                <td key={colIndex} className="px-4 py-3">
                                  {renderCellContent(
                                    header,
                                    row[header.accessor]
                                  )}
                                </td>
                              );
                            })}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={layout.tableHeaders.length}
                          className="p-8 text-center text-muted-foreground"
                        >
                          {hasSearchCriteria || searchResults !== null
                            ? "No results found. Try different search criteria."
                            : "No data available. Click 'Add' button to create new records."}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {displayData && displayData.length > 0 && (
                <div className="flex items-center justify-between border-t px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    Showing {paginatedData.length} of {displayData.length}{" "}
                    results
                    {searchResults !== null && (
                      <span className="ml-1 text-blue-600">
                        (search results)
                      </span>
                    )}
                  </p>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage + 1} of {totalPages}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() =>
                            setCurrentPage((p) => Math.max(0, p - 1))
                          }
                          disabled={currentPage === 0}
                        >
                          <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => setCurrentPage((p) => p + 1)}
                          disabled={currentPage >= totalPages - 1}
                        >
                          <ChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!layout && !layoutLoading.value && !layoutError.value && (
          <Card className="m-6">
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground">
                  Content will be displayed here
                </p>
                <p className="text-sm text-muted-foreground">
                  This section is ready for dynamic content
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
