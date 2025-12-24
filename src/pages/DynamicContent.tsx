import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { MoreVertical, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
  fetchTableData,
  popupOpen,
  currentPopupButton,
  openPopup,
  closePopup,
} from "@/signals/dynamicContent";
import { postData, putData } from "@/services/apiClient";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

// ============================================
// 1. CellRenderer Component
// ============================================
// @ts-ignore
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

// ============================================
// 2. FormPopup Component
// ============================================
// @ts-ignore
const FormPopup = ({
  open,
  onClose,
  button,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogTitle>{button?.popupTitle || "Form"}</DialogTitle>
          <DialogDescription>Fill in the details below</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-4">
            {button?.popupFields?.map((field, index) => (
              <div key={index} className="grid gap-2">
                <Label htmlFor={field.value}>{field.label}</Label>

                {field.type === "select" ? (
                  <Select
                    value={formData[field.value] || ""}
                    onValueChange={(value) =>
                      onFormDataChange({ ...formData, [field.value]: value })
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
                      onFormDataChange({
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

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              button?.popupSubmitText || "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ===========================================
// @ts-ignore
const JsonViewPopup = ({ open, onClose, data }) => {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>JSON Viewer</DialogTitle>
          <DialogDescription>Structured JSON data</DialogDescription>
        </DialogHeader>

        <Card className="flex-1 overflow-auto">
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap break-words">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

// ===========================================

// ============================================
// 3. SearchBar Component
// ============================================
// @ts-ignore
const SearchBar = ({
  layout,
  searchData,
  onSearchDataChange,
  onSearch,
  onClear,
  isSearching,
}) => {
  if (!layout?.searchable || !layout?.search) return null;

  const hasSearchCriteria = Object.values(searchData).some(
    (val) => val !== "" && val !== null && val !== undefined
  );

  return (
    <CardContent>
      <div className="flex gap-2">
        {layout.search.fields.map((field, index) => (
          <div key={index} className="flex-1">
            {field.type === "select" ? (
              <Select
                value={searchData[field.value] || ""}
                onValueChange={(value) =>
                  onSearchDataChange({ ...searchData, [field.value]: value })
                }
              >
                <SelectTrigger>
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
                type={field.type}
                placeholder={field.placeholder}
                value={searchData[field.value] || ""}
                onChange={(e) =>
                  onSearchDataChange({
                    ...searchData,
                    [field.value]: e.target.value,
                  })
                }
              />
            )}
          </div>
        ))}
        <Button onClick={onSearch} disabled={isSearching}>
          {isSearching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Searching...
            </>
          ) : (
            layout.search.searchBtnText || "Search"
          )}
        </Button>
        {hasSearchCriteria && (
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
    </CardContent>
  );
};

// ============================================
// 4. ActionButtons Component
// ============================================
// @ts-ignore
const ActionButtons = ({ buttons, onButtonClick }) => {
  if (!buttons || buttons.length === 0) return null;

  return (
    <div className="flex gap-2 px-6">
      {buttons.map((button, index) => (
        <Button
          key={index}
          variant={button.type === "icon" ? "outline" : "default"}
          size={button.type === "icon" ? "icon" : "default"}
          onClick={() => onButtonClick(button)}
        >
          {button.icon && (
            <DynamicIcon
              name={button.icon}
              className={`h-4 w-4 ${button.type !== "icon" ? "mr-2" : ""}`}
            />
          )}
          {button.type !== "icon" && button.title}
        </Button>
      ))}
    </div>
  );
};

// ============================================
// 5. Pagination Component
// ============================================
// @ts-ignore
const Pagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  isSearchResults,
  onPageChange,
}) => {
  if (totalItems === 0) return null;

  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t px-4 py-3 mt-4">
      <p className="text-sm text-muted-foreground">
        Showing {endItem} of {totalItems} results
        {isSearchResults && (
          <span className="ml-1 text-blue-600">(search results)</span>
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
              onClick={() => onPageChange(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// 6. Main DynamicContent Component
// ============================================
export default function DynamicContent() {
  useSignals();

  const [alert, setAlert] = useState<{
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  } | null>(null);

  function showAlert({
    title,
    description,
    variant = "default",
  }: {
    title: string;
    description?: string;
    variant?: "default" | "destructive";
  }) {
    setAlert({ title, description, variant });
    setTimeout(() => setAlert(null), 4000);
  }

  const [formData, setFormData] = useState({});
  const [searchData, setSearchData] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [jsonPopupOpen, setJsonPopupOpen] = useState(false);
  const [jsonPopupData, setJsonPopupData] = useState<any>(null);

  useEffect(() => {
    setSearchData({});
    setSearchResults(null);
    setCurrentPage(0);
  }, [currentContentItem.value?.title]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchData]);

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

  const handleViewJson = (data: any) => {
    setJsonPopupData(data);
    setJsonPopupOpen(true);
  };

  const handleRowAction = (action: any, rowData: any) => {
    if (action.type === "SHOW_POPUP" && action.popupFields) {
      openPopup(action);
      const initialData: any = {
        id: rowData.id || null,
      };

      console.log("📋 Populating form from row data:", rowData);
      console.log("📝 Action popup fields:", action.popupFields);

      action.popupFields.forEach((field: any) => {
        const formFieldKey = field.value; // Form field key (e.g., "discountType", "status")
        const apiFieldKey = field.apiField || field.value; // API field key (e.g., "couponDiscountType", "active")
        const rowValue = rowData[apiFieldKey]; // Get value from API response

        console.log(`\n🔍 Field: ${formFieldKey} (API: ${apiFieldKey})`);
        console.log(`   → Raw value from API: ${rowValue}`);

        // Skip if value not found in row data
        if (rowValue === undefined || rowValue === null) {
          console.log(`   ⏭️  Field not found in row data`);
          return;
        }

        // Handle status/boolean fields (active true/false -> active/inactive)
        if (field.type === "select" && field.selectOptions) {
          const isStatusField = field.selectOptions.some(
            (opt: any) => opt.value === "active" || opt.value === "inactive"
          );

          if (isStatusField) {
            // Convert boolean to "active" or "inactive"
            initialData[formFieldKey] = rowValue === true || rowValue === "active" ? "active" : "inactive";
            console.log(`   ✅ Status field: ${formFieldKey} = "${initialData[formFieldKey]}"`);
            return;
          }
        }

        // Handle date fields (DD/MM/YYYY -> YYYY-MM-DD format for input)
        if (field.type === "date") {
          if (typeof rowValue === "string" && rowValue.includes("/")) {
            // Convert DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = rowValue.split("/");
            initialData[formFieldKey] = `${year}-${month}-${day}`;
            console.log(`   ✅ Date field: ${formFieldKey} = "${initialData[formFieldKey]}" (converted from ${rowValue})`);
            return;
          } else {
            // Already in correct format or other format
            initialData[formFieldKey] = rowValue;
            console.log(`   ✅ Date field: ${formFieldKey} = "${initialData[formFieldKey]}"`);
            return;
          }
        }

        // Handle array fields (join with comma)
        if (Array.isArray(rowValue)) {
          initialData[formFieldKey] = rowValue.join(", ");
          console.log(`   ✅ Array field: ${formFieldKey} = "${initialData[formFieldKey]}"`);
          return;
        }

        // Default: use value as-is
        initialData[formFieldKey] = rowValue;
        console.log(`   ✅ Field: ${formFieldKey} = "${initialData[formFieldKey]}" (${typeof rowValue})`);
      });

      console.log("\n✅ Final form data:", initialData);
      setFormData(initialData);
    }
  };

  // ============================================
  // CRITICAL: Transform Form Data to API Payload
  // ============================================
  const transformFormDataToPayload = (formData: any, popupFields: any): any => {
    const payload: any = {};

    console.log("🔍 Starting payload transformation...");
    console.log("📝 Form Data:", formData);

    // Always include id if present
    if (formData.id !== undefined && formData.id !== null) {
      payload["id"] = formData.id;
    }

    popupFields.forEach((field: any) => {
      const formFieldKey = field.value; // Key in form state
      const value = formData[formFieldKey];

      console.log(`\n🔄 Processing field: ${formFieldKey}`);
      console.log(`   → Raw Value: ${value}`);
      console.log(`   → Field Type: ${field.type}`);

      // Skip if no value provided
      if (value === undefined || value === null || value === "") {
        console.log(`   ⏭️  Skipping empty field`);
        return;
      }

      // Determine the API key - check for apiField property, otherwise use form key
      const apiKey = field.apiField || formFieldKey;

      // Handle boolean/status fields (active/inactive -> active: true/false)
      if (field.type === "select" && field.selectOptions) {
        const isStatusField = field.selectOptions.some(
          (opt: any) => opt.value === "active" || opt.value === "inactive"
        );

        if (isStatusField) {
          // Status fields always map to "active" key in payload
          const statusKey = field.apiField || "active";
          payload[statusKey] = value === "active";
          console.log(
            `   ✅ Set ${statusKey} = ${value === "active"} (status: ${value})`
          );
          return;
        }
      }

      // Handle date fields (convert YYYY-MM-DD to DD/MM/YYYY)
      if (field.type === "date") {
        if (typeof value === "string" && value.includes("-")) {
          const [year, month, day] = value.split("-");
          payload[apiKey] = `${day}/${month}/${year}`;
        } else {
          payload[apiKey] = value;
        }
        console.log(
          `   ✅ Set ${apiKey} = ${payload[apiKey]} (date formatted)`
        );
        return;
      }

      // Handle array fields (comma-separated to array)
      if (typeof value === "string" && value.includes(",")) {
        payload[apiKey] = value
          .split(",")
          .map((v: string) => v.trim())
          .filter(Boolean);
        console.log(
          `   ✅ Set ${apiKey} = ${JSON.stringify(payload[apiKey])} (array)`
        );
        return;
      }

      // Handle fields that should always be arrays (like subscriptionPlanIds)
      if (
        field.isArray ||
        apiKey.includes("Ids") ||
        apiKey === "subscriptionPlanIds"
      ) {
        payload[apiKey] = typeof value === "string" ? [value] : value;
        console.log(
          `   ✅ Set ${apiKey} = ${JSON.stringify(
            payload[apiKey]
          )} (forced array)`
        );
        return;
      }

      // Default: use the API key and value as-is
      payload[apiKey] = value;
      console.log(`   ✅ Set ${apiKey} = ${value} (${typeof value})`);
    });

    // Add discountAmount as empty string if not provided (optional field)
    if (!("discountAmount" in payload)) {
      payload["discountAmount"] = "";
      console.log(`   ✅ Added default discountAmount = "" (optional)`);
    }

    console.log("\n✅ Final Payload:", JSON.stringify(payload, null, 2));
    return payload;
  };

  const handlePopupSubmit = async () => {
    if (!currentPopupButton.value) return;

    const submitUrl =
      currentPopupButton.value.popupSubmitUrl ||
      currentPopupButton.value.actionUrl;

    if (!submitUrl) {
      showAlert({
        title: "Error",
        description: "No submit URL configured",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = transformFormDataToPayload(
        formData,
        currentPopupButton.value.popupFields || []
      );

      console.log("📦 Payload Being Sent:", JSON.stringify(payload, null, 2));

      const isUpdate =
        payload.id !== null && payload.id !== undefined && payload.id !== "";

      const response = isUpdate
        ? await putData(submitUrl, payload)
        : await postData(submitUrl, payload);

      console.log("✅ API Response:", response);

      showAlert({
        title: "Success",
        description: `${isUpdate ? "Updated" : "Created"} successfully`,
      });

      // Refresh the table data from the current layout
      if (layoutData.value?.getDataUrl) {
        console.log(
          "🔄 Refreshing table data from:",
          layoutData.value.getDataUrl
        );
        try {
          await fetchTableData(layoutData.value.getDataUrl);
          console.log("✅ Table data refreshed");
        } catch (refreshError) {
          console.error("⚠️  Could not refresh table data:", refreshError);
          // Still close popup even if refresh fails
        }
      }

      closePopup();
      setFormData({});
      setSearchResults(null); // Clear search results if any
    } catch (error) {
      console.error("❌ Submit error:", error);
      showAlert({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to submit form",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearch = async () => {
    const layout = layoutData.value;
    if (!layout?.search?.searchActionUrl) {
      console.log("❌ No search action URL configured");
      return;
    }

    // Build search parameters - include ALL fields (even empty ones)
    const searchParams: Record<string, string> = {};

    // Add pagination parameters
    searchParams["pageNo"] = "0";
    searchParams["pageSize"] = "10";

    // Add level parameter (default to SYSTEM if not specified)
    searchParams["level"] = "SYSTEM";

    // Add all search fields (including empty ones)
    if (layout.search.fields) {
      layout.search.fields.forEach((field) => {
        const value = searchData[field.value];
        // Include ALL fields, even if empty
        searchParams[field.value] = value || "";
      });
    }

    console.log("🔍 Search Params:", searchParams);
    setIsSearching(true);

    try {
      // Import apiClient for proper request handling
      const { apiClient } = await import("@/services/apiClient");

      // Ensure the search URL ends with /all if it's /secure/coupon
      let searchUrl = layout.search.searchActionUrl;
      if (searchUrl === "/secure/coupon") {
        searchUrl = "/secure/coupon/all";
      }

      console.log("📍 Search URL:", searchUrl);

      const response = await apiClient(searchUrl, {
        params: searchParams,
      });

      console.log("📦 Search Response:", response);

      // Extract data from response based on API structure
      let results = [];
      if (response.data && Array.isArray(response.data)) {
        results = response.data;
      } else if (Array.isArray(response)) {
        results = response;
      } else if (response.content && Array.isArray(response.content)) {
        results = response.content;
      } else if (response.results && Array.isArray(response.results)) {
        results = response.results;
      }

      setSearchResults(results);
      setCurrentPage(0);

      showAlert({
        title: "Search Complete",
        description: `Found ${results.length} result${
          results.length !== 1 ? "s" : ""
        }`,
      });
    } catch (error) {
      console.error("❌ Search error:", error);
      showAlert({
        title: "Search Failed",
        description:
          error instanceof Error ? error.message : "Failed to search",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchData({});
    setSearchResults(null);
    setCurrentPage(0);
  };

  if (layoutLoading.value || tableDataLoading.value) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentContentItem.value) {
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

  const layout = layoutData.value;

  if (!layout) {
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
    <>
      {alert && (
        <div
          style={{
            position: "fixed",
            top: 16,
            right: 16,
            zIndex: 9999,
            minWidth: 320,
          }}
        >
          <Alert variant={alert.variant}>
            <AlertTitle>{alert.title}</AlertTitle>
            {alert.description && (
              <AlertDescription>{alert.description}</AlertDescription>
            )}
          </Alert>
        </div>
      )}
      <div className="flex flex-col h-full">
        <FormPopup
          open={popupOpen.value}
          onClose={closePopup}
          button={currentPopupButton.value}
          formData={formData}
          onFormDataChange={setFormData}
          onSubmit={handlePopupSubmit}
          isSubmitting={isSubmitting}
        />

        <JsonViewPopup
          open={jsonPopupOpen}
          onClose={() => setJsonPopupOpen(false)}
          data={jsonPopupData}
        />

        <div className="flex items-center justify-between border-b py-4 bg-background">
          <SearchBar
            layout={layout}
            searchData={searchData}
            onSearchDataChange={setSearchData}
            onSearch={handleSearch}
            onClear={clearSearch}
            isSearching={isSearching}
          />

          <ActionButtons
            buttons={layout?.buttons}
            onButtonClick={handleButtonClick}
          />
        </div>

        <div className="flex-1 overflow-y-auto w-full space-y-6">
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

          {layout?.tableHeaders && layout.tableHeaders.length > 0 && (
            <Card>
              <CardHeader />
              <CardContent>
                <div className="border rounded">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {layout.tableHeaders
                          .sort((a, b) => (a.order || 999) - (b.order || 999))
                          .map((header, index) => (
                            <TableHead key={index}>{header.Header}</TableHead>
                          ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isSearching ? (
                        <TableRow>
                          <TableCell
                            colSpan={layout.tableHeaders.length}
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
                      ) : tableDataLoading.value ? (
                        [...Array(5)].map((_, i) => (
                          <TableRow key={i}>
                            {layout.tableHeaders.map((_, j) => (
                              <TableCell key={j}>
                                <Skeleton className="h-4 w-full" />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))
                      ) : tableDataError.value ? (
                        <TableRow>
                          <TableCell
                            colSpan={layout.tableHeaders.length}
                            className="h-24 text-center text-destructive"
                          >
                            <p>{tableDataError.value}</p>
                          </TableCell>
                        </TableRow>
                      ) : paginatedData && paginatedData.length > 0 ? (
                        paginatedData.map((row, rowIndex) => (
                          <TableRow key={rowIndex}>
                            {layout.tableHeaders
                              .sort(
                                (a, b) => (a.order || 999) - (b.order || 999)
                              )
                              .map((header, colIndex) => {
                                if (
                                  header.type === "actions" &&
                                  header.actions
                                ) {
                                  return (
                                    <TableCell key={colIndex}>
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
                                            (action, actionIndex) => (
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
                                    </TableCell>
                                  );
                                }
                                return (
                                  <TableCell key={colIndex}>
                                    <CellRenderer
                                      header={header}
                                      value={row[header.accessor]}
                                      onViewJson={handleViewJson}
                                    />
                                  </TableCell>
                                );
                              })}
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={layout.tableHeaders.length}
                            className="h-24 text-center text-muted-foreground"
                          >
                            {hasSearchCriteria || searchResults !== null
                              ? "No results found. Try different search criteria."
                              : "No data available. Click 'Add' button to create new records."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  totalItems={displayData.length}
                  isSearchResults={searchResults !== null}
                  onPageChange={setCurrentPage}
                />
              </CardContent>
            </Card>
          )}

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
    </>
  );
}
