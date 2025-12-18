import { useEffect } from "react";
import { useLocation } from "react-router-dom";
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
import { FormPopup } from "@/components/common/FormPopup";
import { useSidebar } from "@/hooks/useSidebar";
import { getIcon } from "@/lib/icon-map";
import type {
  DrawerItem,
  SubMenuItem,
  Button as ButtonType,
} from "@/types/sidebar";
import {
  currentContentItem,
  popupOpen,
  currentPopupButton,
  openPopup,
  closePopup,
  setCurrentContentItem,
} from "@/signals/dynamicContent";
import { useSignals } from "@preact/signals-react/runtime";

/**
 * Dynamic content page that renders based on sidebar item clicked
 * Displays buttons, search, and table headers from sidebar config
 */
export default function DynamicContent() {
  useSignals();
  const location = useLocation();
  const { drawerItems, loading: sidebarLoading } = useSidebar();

  useEffect(() => {
    // Find matching sidebar item based on current route
    const findItem = () => {
      for (const item of drawerItems) {
        // Normalize URLs to include /dashboard prefix
        const itemUrl = item.getDataUrl?.startsWith("/dashboard")
          ? item.getDataUrl
          : `/dashboard${item.getDataUrl || ""}`;

        // Check if main item matches
        if (itemUrl === location.pathname) {
          return item;
        }

        // Check subMenuItems
        if (item.subMenuItems) {
          for (const subItem of item.subMenuItems) {
            const subItemUrl = subItem.getDataUrl?.startsWith("/dashboard")
              ? subItem.getDataUrl
              : `/dashboard${subItem.getDataUrl || ""}`;

            if (subItemUrl === location.pathname) {
              return subItem;
            }
          }
        }
      }
      return null;
    };

    const item = findItem();
    setCurrentContentItem(item);

    // TODO: Fetch table data if getDataUrl exists
    // if (item?.getDataUrl) {
    //   fetchTableData(item.getDataUrl)
    // }
  }, [location.pathname, drawerItems]);

  const handleButtonClick = (button: ButtonType) => {
    if (button.action === "showpopup" && button.popupFields) {
      openPopup(button);
    } else if (button.action === "link") {
      // Navigate to link
      console.log("Navigate to:", button.actionUrl);
    } else if (button.action === "download") {
      // Handle download
      console.log("Download from:", button.actionUrl);
    }
  };

  const handlePopupSubmit = async (formData: Record<string, any>) => {
    if (!currentPopupButton.value) return;

    console.log("Form submitted:", {
      url:
        currentPopupButton.value.popupSubmitUrl ||
        currentPopupButton.value.actionUrl,
      data: formData,
    });

    // TODO: Call submitFormData API
    // await submitFormData(currentPopupButton.popupSubmitUrl!, formData)
  };

  if (sidebarLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!currentContentItem.value) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Page Not Found</CardTitle>
          <CardDescription>
            The requested page could not be found
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const Icon =
    "icon" in currentContentItem.value
      ? getIcon(currentContentItem.value.icon)
      : null;

  return (
    <div className="flex flex-col gap-6">
      {/* Form Popup */}
      {currentPopupButton.value && currentPopupButton.value.popupFields && (
        <FormPopup
          open={popupOpen.value}
          onOpenChange={(open) => {
            popupOpen.value = open;
          }}
          title={currentPopupButton.value.popupTitle || "Form"}
          submitText={currentPopupButton.value.popupSubmitText || "Submit"}
          fields={currentPopupButton.value.popupFields}
          onSubmit={handlePopupSubmit}
        />
      )}

      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="size-8 text-primary" />}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {currentContentItem.value.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage and view {currentContentItem.value.title.toLowerCase()}
            </p>
          </div>
        </div>

        {/* Buttons from sidebar config */}
        {currentContentItem.value.buttons &&
          currentContentItem.value.buttons.length > 0 && (
            <div className="flex gap-2">
              {currentContentItem.value.buttons.map((button, index) => {
                const ButtonIcon = getIcon(button.icon);
                return (
                  <Button
                    key={index}
                    variant={button.type === "icon" ? "outline" : "default"}
                    size={button.type === "icon" ? "icon" : "default"}
                    onClick={() => handleButtonClick(button)}
                  >
                    {ButtonIcon && <ButtonIcon className="size-4" />}
                    {button.type !== "icon" && (
                      <span className="ml-2">{button.title}</span>
                    )}
                  </Button>
                );
              })}
            </div>
          )}
      </div>

      {/* Search Section */}
      {currentContentItem.value.searchable &&
        currentContentItem.value.search && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {currentContentItem.value.search.fields.map((field, index) => (
                  <Input
                    key={index}
                    type={field.type}
                    placeholder={field.placeholder}
                    className="flex-1"
                  />
                ))}
                <Button
                  onClick={() => {
                    console.log(
                      "Search clicked:",
                      currentContentItem.value.search?.searchActionUrl
                    );
                    // TODO: Handle search
                  }}
                >
                  {currentContentItem.value.search.searchBtnText}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Table Section */}
      {currentContentItem.value.tableHeaders &&
        currentContentItem.value.tableHeaders.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Data Table</CardTitle>
              <CardDescription>View and manage records</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      {currentContentItem.value.tableHeaders
                        .sort((a, b) => (a.order || 999) - (b.order || 999))
                        .map((header, index) => (
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
                    <tr>
                      <td
                        colSpan={currentContentItem.value.tableHeaders.length}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No data available. Click "Add" button to create new
                        records.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Empty state if no table headers */}
      {!currentContentItem.value.tableHeaders && (
        <Card>
          <CardContent className="flex min-h-100 items-center justify-center">
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
  );
}
