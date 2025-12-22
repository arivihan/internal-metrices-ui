import { useState } from "react";
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
import { MoreVertical } from "lucide-react";
import { getIcon } from "@/lib/icon-map";
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
  setCurrentContentItem,
  popupOpen,
  currentPopupButton,
  openPopup,
  closePopup,
} from "@/signals/dynamicContent";

/**
 * Dynamic content page that renders based on sidebar item clicked
 * Fetches layout data and displays forms, search, and tables
 */
export default function DynamicContent() {
  useSignals();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [searchData, setSearchData] = useState<Record<string, any>>({});

  // No useEffect needed - currentContentItem is set directly from sidebar click handler
  // Just render whatever is in the signal

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

  const handleSearch = () => {
    console.log("Search data:", searchData);

    // Rebuild URL with search params
    if (layout?.search?.searchActionUrl) {
      const url = new URL(
        layout.search.searchActionUrl,
        window.location.origin
      );
      Object.entries(searchData).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, String(value));
        }
      });
      fetchLayoutData(url.toString());
    }
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

  const Icon =
    "icon" in currentContentItem.value
      ? getIcon(currentContentItem.value.icon)
      : null;

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
      <div className="flex items-center justify-between border-b  py-4 bg-background">
        {/* <div className="flex items-center gap-3">
          {Icon && <Icon className="h-8 w-8 text-primary" />}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {currentContentItem.value.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage and view {currentContentItem.value.title.toLowerCase()}
            </p>
          </div>
        </div> */}
        {layout?.searchable && layout?.search && (
          <CardContent>
            <div className="flex gap-2 ">
              {layout.search.fields.map((field: any, index: number) => (
                <div key={index} className="flex-1 ">
                  {field.type === "select" ? (
                    <Select
                      value={searchData[field.value] || ""}
                      onValueChange={(value) =>
                        setSearchData({ ...searchData, [field.value]: value })
                      }
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
                      onChange={(e) =>
                        setSearchData({
                          ...searchData,
                          [field.value]: e.target.value,
                        })
                      }
                    />
                  )}
                </div>
              ))}
              <Button onClick={handleSearch}>
                {layout.search.searchBtnText}
              </Button>
            </div>
          </CardContent>
        )}

        {/* Buttons from layout config */}
        {layout?.buttons && layout.buttons.length > 0 && (
          <div className="flex gap-2">
            {layout.buttons.map((button: any, index: number) => {
              const ButtonIcon = button.icon ? getIcon(button.icon) : null;
              return (
                <Button
                  key={index}
                  variant={button.type === "icon" ? "outline" : "default"}
                  size={button.type === "icon" ? "icon" : "default"}
                  onClick={() => handleButtonClick(button)}
                >
                  {ButtonIcon && <ButtonIcon className="h-4 w-4 mr-2" />}
                  {button.type !== "icon" && button.title}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto w-full space-y-6">
        {/* Search Section */}

        {/* Error Display */}
        {layoutError.value && (
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
              <CardDescription>View and manage records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className=" border">
                <table className="w-full text-sm">
                  <thead className="border-b  bg-muted/50">
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
                    {tableDataLoading.value ? (
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
                    ) : tableData.value && tableData.value.length > 0 ? (
                      tableData.value.map((row: any, rowIndex: number) => (
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
                                  {row[header.accessor] !== undefined &&
                                  row[header.accessor] !== null
                                    ? String(row[header.accessor])
                                    : "-"}
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
                          No data available. Click "Add" button to create new
                          records.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!layout && !layoutLoading.value && !layoutError.value && (
          <Card>
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
