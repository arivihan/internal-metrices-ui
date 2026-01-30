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
import { apiClient } from "@/services/apiClient";
import { TabsViewer } from "@/components/TabsViewer";
import { MappingSelector } from "@/components/MappingSelector";
import { DropdownTableView } from "@/components/DropdownTableView";
import { DualSectionView } from "@/components/DualSectionView";
import { useSignals } from "@preact/signals-react/runtime";
import {
  currentContentItem,
  layoutData,
  layoutLoading,
  layoutError,
  tableData,
  tableDataLoading,
  tableDataError,
  pagination,
  entityName,
  fetchTableData,
  popupOpen,
  currentPopupButton,
  openPopup,
  closePopup,
} from "@/signals/dynamicContent";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ViewDetailsPopup } from "@/components/ViewDetailsPopup";
import { AuditTrailPopup } from "@/components/AuditTrailPopup";
import { DualSectionPopup } from "@/components/DualSectionPopup";

// ============================================
// 1. CellRenderer Component
// ============================================
// @ts-ignore
const CellRenderer = ({ header, value, onViewJson, rowData }) => {
  if (value === undefined || value === null) return "-";

  if (header.Header === "Id") {
    const idValue = String(value);
    return (
      <div
        className={`max-w-37.5 break-all font-mono font-semibold text-primary ${
          idValue.length > 5 ? "text-xs leading-tight" : "text-sm"
        }`}
      >
        {idValue}
      </div>
    );
  }

  if (header.Header === "File Name") {
    const fileUrl = rowData?.url;
    if (fileUrl) {
      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-600 hover:text-chan-500 hover:underline font-medium cursor-pointer"
        >
          {String(value)}
        </a>
      );
    }
    return <div>{String(value)}</div>;
  }

  const isImageUrl = (str: string): boolean => {
    if (typeof str !== "string") return false;
    return /\.(png|jpg|jpeg|gif|svg|webp)(\?.*)?$/i.test(str);
  };

  // Check if this is specifically an Icon URL column (render small)
  const isIconUrlColumn = header.Header?.toLowerCase().includes("icon url");

  // Check if this is a general image column
  const isImageType = header.type === "image";

  // If it's an Icon URL column, render small thumbnail
  if (isIconUrlColumn && isImageUrl(value)) {
    return (
      <div className="flex items-center justify-center py-2">
        <div className="h-12 w-12 overflow-hidden rounded border bg-gray-50 flex items-center justify-center">
          <img
            src={String(value)}
            alt={header.Header}
            className="h-full w-full object-contain"
            onError={(e) => {
              e.currentTarget.src =
                "https://via.placeholder.com/48?text=No+Image";
              e.currentTarget.className =
                "h-full w-full object-contain opacity-50";
            }}
          />
        </div>
      </div>
    );
  }

  // For other image types, use larger dimensions (previous behavior)
  if (isImageType || isImageUrl(value)) {
    return (
      <div className="flex h-[10vh] w-[10vw] overflow-hidden items-center justify-center">
        <img
          src={String(value)}
          alt={header.Header}
          className="w-full h-full object-cover border shadow-sm"
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/64?text=No+Image";
          }}
        />
      </div>
    );
  }

  switch (header.type) {
    case "boolean":
      const boolValue =
        typeof value === "boolean"
          ? value
          : String(value).toLowerCase() === "true";

      // Check if this is a status column (isActive, active, status, Status header)
      const isStatusBooleanColumn =
        (header.accessor &&
          /(^|\.)?(isActive|active|status)$/i.test(String(header.accessor))) ||
        /(^|\s)?status(\s|$)?/i.test(String(header.Header));

      return (
        <div className="font-normal text-sm">
          {isStatusBooleanColumn
            ? boolValue
              ? "Active"
              : "Inactive"
            : boolValue
            ? "True"
            : "False"}
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
interface FormPopupProps {
  open: boolean;
  onClose: () => void;
  button: any;
  formData: any;
  onFormDataChange: (data: any) => void;
  onSubmit: (data: any) => void;
  isSubmitting: boolean;
  onSelectedOptionsChange: (options: any) => void;
  displayOrderValues?: Record<string, any>;
  onDisplayOrderValuesChange: (values: any) => void;
}

const FormPopup = ({
  open,
  onClose,
  button,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
  onSelectedOptionsChange,
  displayOrderValues = {},
  onDisplayOrderValuesChange,
}: FormPopupProps) => {
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>(
    {}
  );
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>(
    {}
  );
  const [languageOptions, setLanguageOptions] = useState<any[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  // Use passed selectedOptions or fallback to local state
  const [localSelectedOptions, setLocalSelectedOptions] = useState<
    Record<string, any[]>
  >({});

  // Fetch dropdown options when field has fetchOptionsUrl
  useEffect(() => {
    if (!open || !button?.popupFields) return;

    button.popupFields.forEach(async (field: any) => {
      // Fetch languages for dynamic-translations field
      if (field.type === "dynamic-translations" && field.languagesUrl) {
        setLoadingLanguages(true);
        try {
          const { dynamicRequest } = await import("@/services/apiClient");
          const response: any = await dynamicRequest(field.languagesUrl, "GET");

          let languages = [];
          if (response?.data && Array.isArray(response.data)) {
            languages = response.data;
          } else if (Array.isArray(response)) {
            languages = response;
          }

          // Transform languages to have both label and value
          const transformedLanguages = languages.map((lang: any) => ({
            value: lang.code,
            label: lang.displayNameEn || lang.nativeName || lang.code,
            original: lang,
          }));

          setLanguageOptions(transformedLanguages);
        } catch (error) {
          console.error(`Failed to fetch languages:`, error);
        } finally {
          setLoadingLanguages(false);
        }
      }

      if (
        (field.type === "select" || field.type === "multi-select") &&
        field.fetchOptionsUrl
      ) {
        setLoadingOptions((prev) => ({ ...prev, [field.value]: true }));
        try {
          const { dynamicRequest } = await import("@/services/apiClient");
          const response: any = await dynamicRequest(
            field.fetchOptionsUrl,
            "GET"
          );

          let options = [];
          // Handle different response formats
          if (response?.content && Array.isArray(response.content)) {
            // Pagination format: {content: [...]}
            options = response.content;
          } else if (response?.data && Array.isArray(response.data)) {
            // Data wrapper format: {data: [...]}
            options = response.data;
          } else if (Array.isArray(response)) {
            // Direct array format
            options = response;
          }

          // Transform options to have both label and value
          const transformedOptions = options.map((opt: any) => {
            let label =
              opt[field.optionLabelKey] ||
              opt.displayName ||
              opt.name ||
              String(opt);
            // If optionLabelKey2 exists, concatenate both labels
            if (field.optionLabelKey2) {
              const label2 = opt[field.optionLabelKey2] || "";
              label = label2 ? `${label} + ${label2}` : label;
            }
            return {
              value: opt[field.optionValueKey] || opt.id,
              label: label,
              original: opt,
            };
          });

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
  }, [open, button]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogTitle>{button?.popupTitle || "Form"}</DialogTitle>
          <DialogDescription>
            {button?.popupSubTitle || "Fill in the details below"}
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          <div className="grid gap-4">
            {button?.popupFields?.map((field: any, index: number) => (
              <div key={index} className="grid gap-2">
                <Label htmlFor={field.value}>{field.label}</Label>

                {field.type === "select" ? (
                  <Select
                    value={formData[field.value] || ""}
                    onValueChange={(value) =>
                      onFormDataChange({ ...formData, [field.value]: value })
                    }
                    disabled={loadingOptions[field.value]}
                  >
                    <SelectTrigger id={field.value}>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingOptions[field.value] ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          Loading...
                        </div>
                      ) : (dropdownOptions[field.value] || []).length > 0 ? (
                        (dropdownOptions[field.value] || []).map(
                          (option, idx) => (
                            <SelectItem key={idx} value={String(option.value)}>
                              {option.label}
                            </SelectItem>
                          )
                        )
                      ) : field.selectOptions &&
                        field.selectOptions.length > 0 ? (
                        field.selectOptions.map((option: any, idx: number) => (
                          <SelectItem key={idx} value={option.value}>
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
                ) : field.type === "multi-select" ? (
                  <div className="space-y-3 border rounded-md p-3">
                    {/* Selected items with display order input */}
                    {(localSelectedOptions[field.value] || []).length > 0 && (
                      <div className="border-b pb-3">
                        <div className="text-xs font-semibold text-muted-foreground mb-2">
                          Selected Items (Set Display Order):
                        </div>
                        <div className="space-y-2">
                          {(localSelectedOptions[field.value] || []).map(
                            (item: any, idx: number) => {
                              const itemId = item[field.optionValueKey || "id"];
                              const displayOrder =
                                (
                                  displayOrderValues[field.value] as Record<
                                    string,
                                    number
                                  >
                                )?.[itemId] ?? idx + 1;
                              return (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 bg-accent/50 p-2 rounded"
                                >
                                  <span className="flex-1 text-sm">
                                    {item[field.optionLabelKey] ||
                                      item.displayName ||
                                      item.name}
                                  </span>
                                  <input
                                    type="number"
                                    placeholder="Order"
                                    value={displayOrder}
                                    onChange={(e) => {
                                      const newDisplayOrderValues = {
                                        ...displayOrderValues,
                                        [field.value]: {
                                          ...(displayOrderValues[field.value] ||
                                            {}),
                                          [itemId]:
                                            parseInt(e.target.value) || 0,
                                        },
                                      };
                                      onDisplayOrderValuesChange(
                                        newDisplayOrderValues
                                      );
                                    }}
                                    className="w-20 h-8 px-2 py-1 border border-input rounded text-sm"
                                    min="0"
                                  />
                                  <button
                                    onClick={() => {
                                      const updated = (
                                        localSelectedOptions[field.value] || []
                                      ).filter((_, i: number) => i !== idx);
                                      const updatedValues = Array.isArray(
                                        formData[field.value]
                                      )
                                        ? formData[field.value].filter(
                                            (v: any) => v !== itemId
                                          )
                                        : [];

                                      onFormDataChange({
                                        ...formData,
                                        [field.value]: updatedValues,
                                      });
                                      const newSelectedOptions = {
                                        ...localSelectedOptions,
                                        [field.value]: updated,
                                      };
                                      setLocalSelectedOptions(
                                        newSelectedOptions
                                      );
                                      onSelectedOptionsChange(
                                        newSelectedOptions
                                      );

                                      // Clean up display order value
                                      const newDisplayOrderValues = {
                                        ...displayOrderValues,
                                      };
                                      if (
                                        newDisplayOrderValues[
                                          field.value
                                        ] as Record<string, number>
                                      ) {
                                        delete (
                                          newDisplayOrderValues[
                                            field.value
                                          ] as Record<string, number>
                                        )[itemId];
                                      }
                                      onDisplayOrderValuesChange(
                                        newDisplayOrderValues
                                      );
                                    }}
                                    className="px-2 py-1 text-destructive hover:bg-destructive/10 rounded text-sm"
                                  >
                                    ×
                                  </button>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    {/* Checkbox list for selection */}
                    {loadingOptions[field.value] ? (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Loading...
                      </div>
                    ) : (dropdownOptions[field.value] || []).length > 0 ? (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-2">
                          Available Options:
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {(dropdownOptions[field.value] || []).map(
                            (option, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 py-1"
                              >
                                <input
                                  type="checkbox"
                                  id={`${field.value}-${idx}`}
                                  checked={
                                    Array.isArray(formData[field.value])
                                      ? formData[field.value].includes(
                                          option.value
                                        )
                                      : false
                                  }
                                  onChange={(e) => {
                                    const current = Array.isArray(
                                      formData[field.value]
                                    )
                                      ? formData[field.value]
                                      : [];
                                    const currentSelected =
                                      localSelectedOptions[field.value] || [];

                                    let updated, updatedSelected;
                                    if (e.target.checked) {
                                      updated = [...current, option.value];
                                      updatedSelected = [
                                        ...currentSelected,
                                        option.original,
                                      ];

                                      // Auto-set display order
                                      const newDisplayOrderValues = {
                                        ...displayOrderValues,
                                        [field.value]: {
                                          ...(displayOrderValues[field.value] ||
                                            {}),
                                          [option.value]:
                                            updatedSelected.length,
                                        },
                                      };
                                      onDisplayOrderValuesChange(
                                        newDisplayOrderValues
                                      );
                                    } else {
                                      updated = current.filter(
                                        (v: any) => v !== option.value
                                      );
                                      updatedSelected = currentSelected.filter(
                                        (opt: any) =>
                                          opt[field.optionValueKey || "id"] !==
                                          option.value
                                      );

                                      // Remove display order value
                                      const newDisplayOrderValues = {
                                        ...displayOrderValues,
                                      };
                                      if (
                                        newDisplayOrderValues[
                                          field.value
                                        ] as Record<string, number>
                                      ) {
                                        delete (
                                          newDisplayOrderValues[
                                            field.value
                                          ] as Record<string, number>
                                        )[option.value];
                                      }
                                      onDisplayOrderValuesChange(
                                        newDisplayOrderValues
                                      );
                                    }

                                    // Store both values and original objects
                                    onFormDataChange({
                                      ...formData,
                                      [field.value]: updated,
                                    });
                                    const newSelectedOptions = {
                                      ...localSelectedOptions,
                                      [field.value]: updatedSelected,
                                    };
                                    setLocalSelectedOptions(newSelectedOptions);
                                    onSelectedOptionsChange(newSelectedOptions);
                                  }}
                                  className="rounded"
                                />
                                <label
                                  htmlFor={`${field.value}-${idx}`}
                                  className="flex-1 cursor-pointer text-sm"
                                >
                                  {option.label}
                                </label>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        No options available
                      </div>
                    )}
                  </div>
                ) : field.type === "dynamic-translations" ? (
                  <div className="space-y-3 border rounded-lg p-4 ">
                    {loadingLanguages ? (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Loading languages...
                      </div>
                    ) : languageOptions.length > 0 ? (
                      <div className="space-y-3">
                        {languageOptions.map((lang, idx) => {
                          const currentTranslations =
                            formData[field.value] || {};
                          return (
                            <div key={idx} className="grid gap-2">
                              <Label
                                htmlFor={`trans-${lang.value}`}
                                className="text-sm font-medium"
                              >
                                {lang.label}
                              </Label>
                              <Input
                                id={`trans-${lang.value}`}
                                type="text"
                                placeholder={`Enter text in ${lang.label}`}
                                value={currentTranslations[lang.value] || ""}
                                onChange={(e) => {
                                  const updated = {
                                    ...currentTranslations,
                                    [lang.value]: e.target.value,
                                  };
                                  onFormDataChange({
                                    ...formData,
                                    [field.value]: updated,
                                  });
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        No languages available
                      </div>
                    )}
                  </div>
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
            <pre className="text-xs whitespace-pre-wrap wrap-break-word">
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
// ============================================
// 3A. Advanced Search Dialog Component
// ============================================
interface AdvancedSearchDialogProps {
  open: boolean;
  onClose: () => void;
  layout: any;
  searchData: any;
  onSearchDataChange: (data: any) => void;
  onSearch: () => void;
  onClear: () => void;
  isSearching: boolean;
}

const AdvancedSearchDialog = ({
  open,
  onClose,
  layout,
  searchData,
  onSearchDataChange,
  onSearch,
  onClear,
  isSearching,
}: AdvancedSearchDialogProps) => {
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>(
    {}
  );
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch dropdown options when dialog opens
  useEffect(() => {
    if (!open || !layout?.search?.fields) return;

    layout.search.fields.forEach(async (field: any) => {
      if (field.type === "select" && field.fetchOptionsUrl) {
        setLoadingOptions((prev) => ({ ...prev, [field.value]: true }));
        try {
          const { dynamicRequest } = await import("@/services/apiClient");
          const response: any = await dynamicRequest(
            field.fetchOptionsUrl,
            "GET"
          );

          let options = [];
          // Handle different response formats
          if (response?.content && Array.isArray(response.content)) {
            // Pagination format: {content: [...]}
            options = response.content;
          } else if (response?.data && Array.isArray(response.data)) {
            // Data wrapper format: {data: [...]}
            options = response.data;
          } else if (Array.isArray(response)) {
            // Direct array format
            options = response;
          }

          const transformedOptions = options.map((opt: any) => {
            let label = opt[field.optionLabelKey] || opt.displayName || opt.name || String(opt);
            // If optionLabelKey2 exists, concatenate both labels
            if (field.optionLabelKey2) {
              const label2 = opt[field.optionLabelKey2] || "";
              label = label2 ? `${label} + ${label2}` : label;
            }
            return {
              value: opt[field.optionValueKey] || opt.id,
              label: label,
            };
          });

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
  }, [open, layout?.search?.fields]);

  const hasSearchCriteria = Object.values(searchData).some(
    (val) => val !== "" && val !== null && val !== undefined
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Advanced Search</DialogTitle>
          <DialogDescription>
            Enter your search criteria to filter results
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {layout?.search?.fields?.map((field: any, index: number) => (
            <div key={index} className="grid gap-2">
              <Label htmlFor={field.value}>
                {field.label || field.placeholder}
              </Label>
              {field.type === "select" ? (
                <Select
                  value={searchData[field.value] || ""}
                  onValueChange={(value) =>
                    onSearchDataChange({ ...searchData, [field.value]: value })
                  }
                  disabled={loadingOptions[field.value]}
                >
                  <SelectTrigger id={field.value}>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingOptions[field.value] ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : (dropdownOptions[field.value] || []).length > 0 ? (
                      (dropdownOptions[field.value] || []).map(
                        (option, idx) => (
                          <SelectItem key={idx} value={String(option.value)}>
                            {option.label}
                          </SelectItem>
                        )
                      )
                    ) : field.selectOptions?.length > 0 ? (
                      field.selectOptions
                        .filter((option: any) => option.value !== "")
                        .map((option: any, idx: number) => (
                          <SelectItem key={idx} value={option.value}>
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
                  id={field.value}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {hasSearchCriteria && (
            <Button variant="outline" onClick={onClear}>
              Clear
            </Button>
          )}
          <Button onClick={onSearch} disabled={isSearching}>
            {isSearching ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              layout?.search?.searchBtnText || "Search"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// 3. SearchBar Component
// ============================================
interface SearchBarProps {
  layout: any;
  searchData: any;
  onSearchDataChange: (data: any) => void;
  onSearch: () => void;
  onClear: () => void;
  isSearching: boolean;
  onAdvancedSearchOpen: () => void;
}

const SearchBar = ({
  layout,
  searchData,
  onSearchDataChange,
  onSearch,
  onClear,
  isSearching,
  onAdvancedSearchOpen,
}: SearchBarProps) => {
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>(
    {}
  );
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>(
    {}
  );

  if (!layout?.searchable || !layout?.search) return null;

  // Fetch dropdown options when needed
  useEffect(() => {
    if (!layout?.search?.fields) return;

    layout.search.fields.forEach(async (field: any) => {
      if (field.type === "select" && field.fetchOptionsUrl) {
        setLoadingOptions((prev) => ({ ...prev, [field.value]: true }));
        try {
          const { dynamicRequest } = await import("@/services/apiClient");
          const response: any = await dynamicRequest(
            field.fetchOptionsUrl,
            "GET"
          );

          let options = [];
          // Handle different response formats
          if (response?.content && Array.isArray(response.content)) {
            // Pagination format: {content: [...]}
            options = response.content;
          } else if (response?.data && Array.isArray(response.data)) {
            // Data wrapper format: {data: [...]}
            options = response.data;
          } else if (Array.isArray(response)) {
            // Direct array format
            options = response;
          }

          const transformedOptions = options.map((opt: any) => {
            let label = opt[field.optionLabelKey] || opt.displayName || opt.name || String(opt);
            // If optionLabelKey2 exists, concatenate both labels
            if (field.optionLabelKey2) {
              const label2 = opt[field.optionLabelKey2] || "";
              label = label2 ? `${label} + ${label2}` : label;
            }
            return {
              value: opt[field.optionValueKey] || opt.id,
              label: label,
            };
          });

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
  }, [layout?.search?.fields]);

  const fieldCount = layout.search.fields?.length || 0;
  const hasMoreThan4Fields = fieldCount > 4;
  const visibleFields = hasMoreThan4Fields
    ? layout.search.fields.slice(0, 4)
    : layout.search.fields;

  const hasSearchCriteria = Object.values(searchData).some(
    (val) => val !== "" && val !== null && val !== undefined
  );

  return (
    <CardContent>
      <div className="flex gap-2">
        {visibleFields.map((field: any, index: number) => (
          <div key={index} className="flex-1">
            {field.type === "select" ? (
              <Select
                value={searchData[field.value] || ""}
                onValueChange={(value) =>
                  onSearchDataChange({ ...searchData, [field.value]: value })
                }
                disabled={loadingOptions[field.value]}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions[field.value] ? (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Loading...
                    </div>
                  ) : (dropdownOptions[field.value] || []).length > 0 ? (
                    (dropdownOptions[field.value] || []).map(
                      (option: any, idx: number) => (
                        <SelectItem key={idx} value={String(option.value)}>
                          {option.label}
                        </SelectItem>
                      )
                    )
                  ) : field.selectOptions?.length > 0 ? (
                    field.selectOptions
                      .filter((option: any) => option.value !== "")
                      .map((option: any, idx: number) => (
                        <SelectItem key={idx} value={option.value}>
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
        {hasMoreThan4Fields && (
          <Button variant="outline" onClick={onAdvancedSearchOpen}>
            More Filters
          </Button>
        )}
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
interface ActionButtonsProps {
  buttons: any[];
  onButtonClick: (button: any) => void;
}

const ActionButtons = ({ buttons, onButtonClick }: ActionButtonsProps) => {
  if (!buttons || buttons.length === 0) return null;

  return (
    <div className="flex gap-2 px-6">
      {buttons.map((button: any, index: number) => (
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
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  isSearchResults: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const Pagination = ({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  isSearchResults,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) => {
  if (totalItems === 0) return null;

  const startItem = currentPage * pageSize + 1;
  const endItem = Math.min((currentPage + 1) * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t px-4 py-3">
      <div className="flex items-center gap-4">
        <p className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalItems} {isSearchResults ? "results" : "items"}
        </p>
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Rows per page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
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
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any[]>>(
    {}
  );
  const [displayOrderValues, setDisplayOrderValues] = useState<
    Record<string, Record<string, number>>
  >({});
  const [searchData, setSearchData] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [jsonPopupOpen, setJsonPopupOpen] = useState(false);
  const [jsonPopupData, setJsonPopupData] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewDetailsData, setViewDetailsData] = useState<any>(null);
  const [isAuditTrailPopup, setIsAuditTrailPopup] = useState(false);
  const [auditTrailPagination, setAuditTrailPagination] = useState({
    currentPage: 0,
    totalPages: 1,
    totalElements: 0,
    pageSize: 10,
    isLoading: false,
    fetchUrl: "",
    entityName: "",
    entityId: "", // For row-wise audit trail
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<any>(null);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [tabsData, setTabsData] = useState<Record<string, any[]>>({});
  const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({});
  const [tabErrors, setTabErrors] = useState<Record<string, string>>({});
  const [tabPagination, setTabPagination] = useState<
    Record<
      string,
      {
        currentPage: number;
        totalPages: number;
        pageSize: number;
        totalItems: number;
      }
    >
  >({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{
    action: any;
    rowData: any;
  } | null>(null);

  useEffect(() => {
    setSearchData({});
    setSearchResults(null);
    setCurrentPage(0);
  }, [currentContentItem.value?.title]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchData]);

  // Initialize first tab when layout type is TABS
  useEffect(() => {
    console.log(`[TabsInitEffect] 🔍 Checking layout data:`, {
      type: layoutData.value?.type,
      hasTabsArray: !!layoutData.value?.tabs,
      tabsLength: layoutData.value?.tabs?.length,
      fullData: layoutData.value,
    });

    if (
      layoutData.value?.type === "TABS" &&
      layoutData.value?.tabs?.length > 0
    ) {
      console.log(
        `[TabsInitEffect] ✅ TABS layout detected, initializing first tab`
      );
      const firstTab = layoutData.value.tabs[0];
      setActiveTab(firstTab.tabId);
      setTabsData({});
      setLoadingTabs({});
      setTabErrors({});
      // Fetch first tab data
      handleTabChange(firstTab.tabId, firstTab.getDataUrl);
    } else {
      console.log(
        `[TabsInitEffect] ❌ Layout is not TABS type or no tabs array`
      );
    }
  }, [layoutData.value]);

  // Handle pagination changes - re-run search when page changes

  const displayData =
    searchResults !== null ? searchResults : tableData.value || [];

  const handleButtonClick = (button: any) => {
    // Handle SHOW_POPUP with popupLayout (dual-section, etc.)
    if (button.type === "SHOW_POPUP" && button.popupLayout) {
      openPopup(button);
      setFormData({});
      setSelectedOptions({});
      setDisplayOrderValues({});
    }
    // Handle SHOW_POPUP with popupFields (form-based)
    else if (button.type === "SHOW_POPUP" && button.popupFields) {
      openPopup(button);
      setFormData({});
      setSelectedOptions({});
      setDisplayOrderValues({});
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

  const fetchAuditTrailPage = async (
    fetchUrl: string,
    entityName: string,
    pageNo: number,
    entityId?: string
  ) => {
    try {
      setAuditTrailPagination((prev) => ({ ...prev, isLoading: true }));

      // Build URL based on whether it's row-wise (with entityId) or table-wise
      let url: string;
      if (entityId) {
        // Row-wise audit: /audit-logs?entityName=X&entityId=Y&pageNo=Z&pageSize=10
        url = `${fetchUrl}?entityName=${entityName}&entityId=${entityId}&pageNo=${pageNo}&pageSize=10`;
      } else {
        // Table-wise audit: /audit-logs?entityName=X&pageNo=Y&pageSize=10
        url = `${fetchUrl}?entityName=${entityName}&pageNo=${pageNo}&pageSize=10`;
      }
      console.log("[DynamicContent] Fetching audit trail page:", url);

      const { dynamicRequest } = await import("@/services/apiClient");
      const response = await dynamicRequest(url, "GET");

      console.log("[DynamicContent] Audit data received:", response);

      const auditData = Array.isArray((response as any)?.content)
        ? (response as any).content
        : response;

      setViewDetailsData(auditData);
      setAuditTrailPagination((prev) => ({
        ...prev,
        currentPage: (response as any)?.pageNumber ?? pageNo,
        totalPages: (response as any)?.totalPages ?? 1,
        totalElements: (response as any)?.totalElements ?? auditData.length,
        pageSize: (response as any)?.pageSize ?? 10,
        isLoading: false,
      }));
    } catch (error) {
      console.error("[DynamicContent] Failed to fetch audit trail:", error);
      setAuditTrailPagination((prev) => ({ ...prev, isLoading: false }));
      showAlert({
        title: "Error",
        description: "Failed to fetch audit trail",
        variant: "destructive",
      });
    }
  };

  const handleAuditPageChange = (newPage: number) => {
    const { fetchUrl, entityName, entityId } = auditTrailPagination;
    if (fetchUrl && entityName) {
      fetchAuditTrailPage(fetchUrl, entityName, newPage, entityId || undefined);
    }
  };

  const handleAuditButtonClick = async (auditButton: any) => {
    if (auditButton.type === "AUDIT_TRAIL") {
      // Store the fetch URL and entity name for pagination (table-wise, no entityId)
      setAuditTrailPagination((prev) => ({
        ...prev,
        fetchUrl: auditButton.auditFetchUrl,
        entityName: auditButton.entityName,
        entityId: "", // Clear entityId for table-wise audit
        currentPage: 0,
      }));

      setIsAuditTrailPopup(true);
      setViewDetailsOpen(true);

      // Fetch first page (no entityId for table-wise)
      await fetchAuditTrailPage(
        auditButton.auditFetchUrl,
        auditButton.entityName,
        0
      );
    }
  };
  const handleTabChange = async (
    tabId: string,
    getDataUrl: string,
    page: number = 0
  ) => {
    // Check if we already have the data cached and it's the same page
    const currentPageForTab = tabPagination[tabId]?.currentPage ?? 0;
    if (tabsData[tabId] && currentPageForTab === page && page === 0) {
      // Only use cache for first page on initial tab change
      setActiveTab(tabId);
      // Clear any previous errors
      setTabErrors((prev) => {
        const updated = { ...prev };
        delete updated[tabId];
        return updated;
      });
      return;
    }

    // Set loading state and fetch data
    setLoadingTabs((prev) => ({ ...prev, [tabId]: true }));
    setActiveTab(tabId);
    // Clear any previous errors
    setTabErrors((prev) => {
      const updated = { ...prev };
      delete updated[tabId];
      return updated;
    });

    try {
      const { dynamicRequest } = await import("@/services/apiClient");
      const response = await dynamicRequest(getDataUrl, "GET", undefined, {
        params: { level: "SYSTEM", pageNo: String(page), pageSize: "10" },
      });

      console.log(`📦 Tab ${tabId} Response (page ${page}):`, response);

      // Handle wrapped response
      let responseData: any = response;
      if (
        (response as any)?.data &&
        typeof (response as any).data === "object"
      ) {
        responseData = (response as any).data;
      }

      let results = [];
      let paginationInfo = {
        currentPage: page,
        totalPages: 1,
        pageSize: 10,
        totalElements: 0,
      };

      if (
        (responseData as any)?.content &&
        Array.isArray((responseData as any).content)
      ) {
        results = (responseData as any).content;
        paginationInfo = {
          currentPage: (responseData as any).pageNumber ?? page,
          totalPages: (responseData as any).totalPages ?? 1,
          pageSize: (responseData as any).pageSize ?? 10,
          totalElements: (responseData as any).totalElements ?? results.length,
        };
      } else if (
        (responseData as any)?.data &&
        Array.isArray((responseData as any).data)
      ) {
        results = (responseData as any).data;
        paginationInfo.totalElements = results.length;
      } else if (Array.isArray(responseData)) {
        results = responseData;
        paginationInfo.totalElements = results.length;
      }

      setTabsData((prev) => ({ ...prev, [tabId]: results }));
      setTabPagination((prev) => ({ ...prev, [tabId]: paginationInfo }));
    } catch (error) {
      console.error(`❌ Error fetching tab ${tabId}:`, error);
      const errorMessage =
        error instanceof Error ? error.message : "Request failed";
      setTabErrors((prev) => ({ ...prev, [tabId]: errorMessage }));
      showAlert({
        title: `Failed to load ${tabId} tab`,
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingTabs((prev) => ({ ...prev, [tabId]: false }));
    }
  };

  const handleTabPageChange = async (tabId: string, newPage: number) => {
    const currentTab = layoutData.value?.tabs?.find(
      (tab: any) => tab.tabId === tabId
    );
    if (!currentTab) return;

    await handleTabChange(tabId, currentTab.getDataUrl, newPage);
  };

  const confirmStatusToggle = async () => {
    if (!confirmDialogData) return;

    const {
      action,
      rowData,
      statusField,
      newStatus,
      activeLabel,
      inactiveLabel,
    } = confirmDialogData;

    try {
      setIsSubmitting(true);

      // Replace {id} placeholder with actual ID
      const toggleUrl = action.popupSubmitUrl.replace("{id}", rowData.id);

      // Build request body with the new status
      const requestBody: any = {};
      requestBody[statusField] = newStatus;

      console.log("📤 Sending status toggle request:", {
        url: toggleUrl,
        body: requestBody,
      });

      // Send API request to toggle status
      const response = await apiClient(toggleUrl, {
        method: action.method || "PATCH",
        body: JSON.stringify(requestBody),
      });

      console.log("✅ Status toggled successfully:", response);

      showAlert({
        title: "Success",
        description: `Status changed to ${
          newStatus ? activeLabel : inactiveLabel
        }`,
        variant: "default",
      });

      // Refresh the table data from the server
      if (layoutData.value?.getDataUrl) {
        console.log("🔄 Refreshing table data after status toggle");
        try {
          await fetchTableData(layoutData.value.getDataUrl);
          console.log("✅ Table data refreshed after status toggle");
        } catch (refreshError) {
          console.error("⚠️ Could not refresh table data:", refreshError);
        }
      }

      // If we're in TabsViewer, also refresh the active tab data
      if (activeTab && layoutData.value?.tabs) {
        const activeTabConfig = layoutData.value.tabs.find(
          (t: any) => t.tabId === activeTab
        );
        if (activeTabConfig?.getDataUrl) {
          console.log(`🔄 Refreshing tab data for ${activeTab} after status toggle`);
          try {
            const currentPage = tabPagination[activeTab]?.currentPage ?? 0;
            await handleTabChange(activeTab, activeTabConfig.getDataUrl, currentPage);
            console.log(`✅ Tab data refreshed for ${activeTab}`);
          } catch (tabRefreshError) {
            console.error(`⚠️ Could not refresh tab data:`, tabRefreshError);
          }
        }
      }

      // Close confirmation dialog
      setConfirmDialogOpen(false);
      setConfirmDialogData(null);
    } catch (error) {
      console.error("❌ Failed to toggle status:", error);
      showAlert({
        title: "Error",
        description: "Failed to change status",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRowAction = (action: any, rowData: any) => {
    // Handle STATUS_TOGGLE action (show confirmation dialog first)
    if (action.type === "STATUS_TOGGLE") {
      const statusField = action.statusField || "isActive";
      const currentStatus = rowData[statusField];
      const newStatus = !currentStatus;

      const activeLabel = action.activeLabel || "Active";
      const inactiveLabel = action.inactiveLabel || "Inactive";

      // Store data for confirmation
      setConfirmDialogData({
        action,
        rowData,
        statusField,
        currentStatus,
        newStatus,
        activeLabel,
        inactiveLabel,
        message: `Are you sure you want to change status to ${
          newStatus ? activeLabel : inactiveLabel
        }?`,
      });
      setConfirmDialogOpen(true);
      return;
    }

    // Handle VIEW action with viewFetchDetails (fetch and display details)
    if (action.type === "SHOW_POPUP" && action.viewFetchDetails) {
      console.log("🔍 Fetching view details from API:", {
        viewFetchDetails: action.viewFetchDetails,
        rowId: rowData.id,
      });

      // Check if this is an audit trail action
      const isAuditTrail =
        action.title === "Audit Trail" ||
        action.popupTitle?.includes("Audit") ||
        action.viewFetchDetails?.includes("audit-logs");

      // Get entityName - use signal value first, then fallback to derived name
      let entityNameToUse =
        entityName.value || layoutData.value?.entityName || null;

      // If still no entityName, derive it from the layout title or current content
      if (!entityNameToUse) {
        const title = currentContentItem.value?.title || "";
        // Convert "Academic Year" to "AcademicYear"
        entityNameToUse =
          title
            .split(" ")
            .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
            .join("") || null;
      }

      console.log("📍 Using entityName:", entityNameToUse);

      // Replace placeholders in URL
      let fetchUrl = action.viewFetchDetails
        .replace("{id}", String(rowData.id))
        .replace("{entityId}", String(rowData.id))
        .replace("{entityName}", entityNameToUse || "");

      console.log("🔗 Final fetch URL:", fetchUrl);

      if (isAuditTrail) {
        // Extract base URL, entity name, and entityId for row-wise pagination
        const baseUrl = fetchUrl.split("?")[0];
        const urlParams = new URLSearchParams(fetchUrl.split("?")[1] || "");
        const entityParam = urlParams.get("entityName") || entityNameToUse || "";
        const entityIdParam = urlParams.get("entityId") || String(rowData.id) || "";

        // Store for pagination (row-wise with entityId)
        setAuditTrailPagination((prev) => ({
          ...prev,
          fetchUrl: baseUrl,
          entityName: entityParam,
          entityId: entityIdParam,
          currentPage: 0,
        }));

        setIsAuditTrailPopup(true);
        setViewDetailsOpen(true);

        // Fetch first page with entityId for row-wise audit
        fetchAuditTrailPage(baseUrl, entityParam, 0, entityIdParam);
      } else {
        // Fetch the details normally
        apiClient(fetchUrl, { method: "GET" })
          .then((response: any) => {
            console.log("✅ Details fetched:", response);
            setViewDetailsData(response);
            setIsAuditTrailPopup(false);
            setViewDetailsOpen(true);
          })
          .catch((error) => {
            console.error("❌ Failed to fetch details:", error);
            showAlert({
              title: "Error",
              description: "Failed to fetch details",
              variant: "destructive",
            });
          });
      }

      return;
    }

    // Handle VIEW action (display row data directly)
    if (
      (action.type === "link" || action.title?.toLowerCase() === "view") &&
      !action.viewFetchDetails
    ) {
      console.log("🔍 Opening view details for:", rowData);
      setViewDetailsData(rowData);
      setViewDetailsOpen(true);
      return;
    }

    // Handle SHOW_POPUP action (Edit)
    if (action.type === "SHOW_POPUP" && action.popupFields) {
      // Store rowData in the action object so it's available during submission
      const actionWithRowData = { ...action, rowData };
      openPopup(actionWithRowData);
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
        if (field.type === "select") {
          const isStatusField =
            field.selectOptions &&
            field.selectOptions.some(
              (opt: any) => opt.value === "active" || opt.value === "inactive"
            );

          if (isStatusField) {
            // Convert boolean to "active" or "inactive"
            initialData[formFieldKey] =
              rowValue === true || rowValue === "active"
                ? "active"
                : "inactive";
            console.log(
              `   ✅ Status field: ${formFieldKey} = "${initialData[formFieldKey]}"`
            );
            return;
          }

          // Handle boolean fields that should map to true/false options
          if (typeof rowValue === "boolean") {
            // Convert boolean to "true" or "false" string for select field
            initialData[formFieldKey] = rowValue ? "true" : "false";
            console.log(
              `   ✅ Boolean field: ${formFieldKey} = "${initialData[formFieldKey]}"`
            );
            return;
          }
        }

        // Handle date fields (DD/MM/YYYY -> YYYY-MM-DD format for input)
        if (field.type === "date") {
          if (typeof rowValue === "string" && rowValue.includes("/")) {
            // Convert DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = rowValue.split("/");
            initialData[formFieldKey] = `${year}-${month}-${day}`;
            console.log(
              `   ✅ Date field: ${formFieldKey} = "${initialData[formFieldKey]}" (converted from ${rowValue})`
            );
            return;
          } else {
            // Already in correct format or other format
            initialData[formFieldKey] = rowValue;
            console.log(
              `   ✅ Date field: ${formFieldKey} = "${initialData[formFieldKey]}"`
            );
            return;
          }
        }

        // Handle array fields (join with comma)
        if (Array.isArray(rowValue)) {
          // Check if this is a dynamic-translations field
          if (field.type === "dynamic-translations") {
            // Convert array of translation objects to key-value pair
            const translationObj: any = {};
            rowValue.forEach((trans: any) => {
              if (trans.languageCode && trans.displayName) {
                translationObj[trans.languageCode] = trans.displayName;
              }
            });
            initialData[formFieldKey] = translationObj;
            console.log(
              `   ✅ Translations field: ${formFieldKey} = ${JSON.stringify(
                translationObj
              )}`
            );
            return;
          }

          initialData[formFieldKey] = rowValue.join(", ");
          console.log(
            `   ✅ Array field: ${formFieldKey} = "${initialData[formFieldKey]}"`
          );
          return;
        }

        // Handle dynamic-translations field (object type)
        if (
          field.type === "dynamic-translations" &&
          typeof rowValue === "object"
        ) {
          initialData[formFieldKey] = rowValue;
          console.log(
            `   ✅ Translations field: ${formFieldKey} = set from row data`
          );
          return;
        }

        // Default: use value as-is
        initialData[formFieldKey] = rowValue;
        console.log(
          `   ✅ Field: ${formFieldKey} = "${
            initialData[formFieldKey]
          }" (${typeof rowValue})`
        );
      });

      console.log("\n✅ Final form data:", initialData);
      setFormData(initialData);
    }

    // Handle DELETE_CONFIRM action
    if (action.type === "DELETE_CONFIRM") {
      // Show confirmation dialog instead of window.confirm
      setPendingDelete({ action, rowData });
      setDeleteConfirmOpen(true);
      return;
    }
  };

  // ============================================
  // CRITICAL: Transform Form Data to API Payload
  // ============================================
  const transformFormDataToPayload = (formData: any, popupFields: any): any => {
    const payload: any = {};

    console.log("🔍 Starting payload transformation...");
    console.log("📝 Form Data:", formData);
    console.log("🎯 Selected Options:", selectedOptions);

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

      // Handle multi-select fields with object transformation
      if (
        field.type === "multi-select" &&
        Array.isArray(value) &&
        value.length > 0
      ) {
        // Get the selected original objects for this field
        const selectedObjs = selectedOptions[field.value] || [];

        if (selectedObjs.length > 0) {
          // Transform selected objects to have gradeId and displayOrder (or other required fields)
          const transformedObjects = selectedObjs.map((obj: any) => {
            const idKey = field.optionValueKey || "id";

            // Determine the output ID key name based on the field name
            // E.g., "gradeDisplayOrderRequests" -> "gradeId"
            //       "streams" -> "streamId"
            let outputIdKey = idKey;

            if (apiKey === "gradeDisplayOrderRequests") {
              outputIdKey = "gradeId";
            } else if (apiKey === "streams") {
              outputIdKey = "streamId";
            } else if (apiKey.endsWith("Ids")) {
              // Generic fallback: remove "Ids" and add "Id"
              outputIdKey = apiKey.replace("Ids", "Id");
            } else if (apiKey.endsWith("s")) {
              // Remove plural 's' and add 'Id'
              outputIdKey = apiKey.slice(0, -1) + "Id";
            }

            const transformed: any = {
              [outputIdKey]: obj[idKey],
            };

            // Include displayOrder from the displayOrderValues state
            const displayOrder = displayOrderValues[field.value]?.[obj[idKey]];
            if (displayOrder !== undefined && displayOrder !== null) {
              transformed.displayOrder = displayOrder;
            } else if (obj.displayOrder !== undefined) {
              // Fallback to original object's displayOrder if available
              transformed.displayOrder = obj.displayOrder;
            }

            return transformed;
          });

          payload[apiKey] = transformedObjects;
          console.log(
            `   ✅ Set ${apiKey} = ${JSON.stringify(
              transformedObjects
            )} (multi-select with objects + displayOrder)`
          );
          return;
        }
      }

      // Handle boolean/status fields (active/inactive -> active: true/false)
      if (field.type === "select") {
        const isStatusField =
          field.selectOptions &&
          field.selectOptions.some(
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

        // Handle boolean fields (true/false strings -> booleans)
        if (value === "true" || value === "false") {
          payload[apiKey] = value === "true";
          console.log(
            `   ✅ Set ${apiKey} = ${payload[apiKey]} (boolean: ${value})`
          );
          return;
        }

        // Handle discount type field - set BOTH couponDiscountType and discountType
        if (
          formFieldKey === "discountType" ||
          apiKey === "couponDiscountType"
        ) {
          payload["couponDiscountType"] = value;
          payload["discountType"] = value;
          console.log(`   ✅ Set couponDiscountType & discountType = ${value}`);
          return;
        }

        // For regular select fields (including those with fetchOptionsUrl), just pass the value as-is
        payload[apiKey] = value;
        console.log(`   ✅ Set ${apiKey} = ${value} (select field)`);
        return;
      }

      // Handle dynamic-translations fields (key-value pairs)
      if (field.type === "dynamic-translations") {
        if (typeof value === "object" && Object.keys(value).length > 0) {
          payload[apiKey] = value;
          console.log(
            `   ✅ Set ${apiKey} = ${JSON.stringify(
              value
            )} (translations key-value pairs)`
          );
        } else {
          payload[apiKey] = {};
          console.log(`   ✅ Set ${apiKey} = {} (empty translations)`);
        }
        return;
      }

      // Handle date fields (convert YYYY-MM-DD to DD/MM/YYYY)
      if (field.type === "date") {
        let formattedDate = value;
        if (typeof value === "string" && value.includes("-")) {
          const [year, month, day] = value.split("-");
          // formattedDate = `${day}/${month}/${year}`;
          formattedDate = `${year}-${month}-${day}`;
        }

        // Set BOTH the string version and the regular version
        if (apiKey === "validFromInString") {
          payload["validFrom"] = formattedDate;
          payload["validFromInString"] = formattedDate;
          console.log(
            `   ✅ Set validFrom & validFromInString = ${formattedDate}`
          );
        } else if (apiKey === "validToInString") {
          payload["validTo"] = formattedDate;
          payload["validToInString"] = formattedDate;
          console.log(`   ✅ Set validTo & validToInString = ${formattedDate}`);
        } else {
          payload[apiKey] = formattedDate;
          console.log(
            `   ✅ Set ${apiKey} = ${formattedDate} (date formatted)`
          );
        }
        return;
      }

      // IMPORTANT: Only convert comma-separated to array if field is explicitly marked with isArray: true
      // Otherwise, send as-is (string format) to API
      if (field.isArray && typeof value === "string" && value.includes(",")) {
        payload[apiKey] = value
          .split(",")
          .map((v: string) => v.trim())
          .filter(Boolean);
        console.log(
          `   ✅ Set ${apiKey} = ${JSON.stringify(
            payload[apiKey]
          )} (array - isArray field)`
        );
        return;
      }

      // Handle fields that should always be arrays (like subscriptionPlanIds) - only if they end with Ids
      if (
        (apiKey.includes("Ids") &&
          apiKey !== "batchId" &&
          apiKey !== "academicYearId") ||
        apiKey === "subscriptionPlanIds"
      ) {
        payload[apiKey] = typeof value === "string" ? [value] : value;
        console.log(
          `   ✅ Set ${apiKey} = ${JSON.stringify(
            payload[apiKey]
          )} (forced array - Ids suffix)`
        );
        return;
      }

      // Default: use the API key and value as-is (keep string format)
      payload[apiKey] = value;
      console.log(
        `   ✅ Set ${apiKey} = ${value} (${typeof value}) - sent as-is`
      );
    });

    // Add discountAmount as null if not provided (optional field)
    if (!("discountAmount" in payload)) {
      payload["discountAmount"] = null;
      console.log(`   ✅ Added default discountAmount = null (optional)`);
    }

    // Add subscriptionPlanIds as null if not provided
    if (!("subscriptionPlanIds" in payload)) {
      payload["subscriptionPlanIds"] = null;
      console.log(`   ✅ Added default subscriptionPlanIds = null`);
    }

    console.log("\n✅ Final Payload:", JSON.stringify(payload, null, 2));
    return payload;
  };

  const handlePopupSubmit = async (payloadOrEvent?: any) => {
    if (!currentPopupButton.value) return;

    // Check if the first parameter is an event object and ignore it
    let dualSectionPayload: any = undefined;
    if (payloadOrEvent && typeof payloadOrEvent === "object") {
      // If it's a React event, ignore it
      if (
        payloadOrEvent.nativeEvent ||
        payloadOrEvent.type === "click" ||
        payloadOrEvent._targetInst !== undefined
      ) {
        console.log("[handlePopupSubmit] Ignoring click event object");
        dualSectionPayload = undefined;
      } else {
        // It's actual payload data from dual-section popup
        dualSectionPayload = payloadOrEvent;
      }
    }

    let submitUrl =
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

    // 🔥 NEW: Replace URL variables like {id} with actual values from formData or rowData
    submitUrl = submitUrl.replace(/\{(\w+)\}/g, (match, variable: string) => {
      let value = (formData as Record<string, any>)[variable];

      // If exact variable not found in formData, try rowData (for edit operations)
      if (
        (value === undefined || value === null) &&
        (currentPopupButton.value as any)?.rowData
      ) {
        value = (currentPopupButton.value as any).rowData[variable];
      }

      // If still not found, try alternative mappings
      if (value === undefined || value === null) {
        // Try removing "Id" suffix and see if that exists (e.g., examGradeMappingId -> examGradeMapping)
        if (variable.endsWith("Id")) {
          const altKey = variable.slice(0, -2); // Remove "Id"
          value =
            (formData as Record<string, any>)[altKey] ||
            (currentPopupButton.value as any)?.rowData?.[altKey];
        }

        // Try looking for just "id" if it's a MappingId pattern
        if (
          (value === undefined || value === null) &&
          variable.endsWith("MappingId")
        ) {
          value =
            (formData as Record<string, any>)["id"] ||
            (currentPopupButton.value as any)?.rowData?.["id"];
        }
      }

      if (value === undefined || value === null) {
        console.warn(
          `⚠️ Variable ${variable} not found in formData or rowData, keeping placeholder`
        );
        return match; // Keep the placeholder if value not found
      }
      console.log(`✅ Replacing {${variable}} with "${value}"`);
      return String(value);
    });

    console.log(`📍 Final URL: ${submitUrl}`);

    setIsSubmitting(true);

    try {
      // For dual-section popups, use the payload directly from the popup
      let payload: any = dualSectionPayload;

      // For regular form popups, transform the form data
      if (!payload) {
        // 🎯 SPECIAL CASE: Mapping updates (exam-grade, exam-stream, etc.)
        // Check if URL contains mapping pattern and method is PATCH
        const isMappingUpdate =
          currentPopupButton.value.method === "PATCH" &&
          (submitUrl.includes("/exam-grades/") ||
            submitUrl.includes("/exam-stream/")) &&
          currentPopupButton.value.popupFields?.some(
            (f: any) => f.value === "displayOrder"
          );

        if (isMappingUpdate) {
          // For mapping updates, ONLY send displayOrder
          const displayOrderValue = formData?.displayOrder;
          if (displayOrderValue === undefined || displayOrderValue === null) {
            throw new Error(
              "displayOrder value is required for mapping update"
            );
          }

          payload = {
            displayOrder: parseInt(String(displayOrderValue).trim(), 10),
          };
          console.log("📋 [MAPPING UPDATE] Payload:", payload);
        } else {
          // For all other forms, use the standard transformation
          payload = transformFormDataToPayload(
            formData,
            currentPopupButton.value.popupFields || []
          );
        }
      }

      // Validate payload exists
      if (!payload) {
        throw new Error("Failed to create payload for submission");
      }

      // Create a safe JSON string that handles circular references
      const safeStringify = (obj: any) => {
        const seen = new WeakSet();
        return JSON.stringify(
          obj,
          (key, value) => {
            if (typeof value === "object" && value !== null) {
              if (seen.has(value)) {
                return "[Circular Reference]";
              }
              seen.add(value);
            }
            return value;
          },
          2
        );
      };

      console.log("📦 Payload Being Sent:", safeStringify(payload));

      // Get the HTTP method from config (default to POST)
      const method = currentPopupButton.value.method || "POST";
      console.log(`🔧 Using HTTP Method: ${method}`);

      // Determine if it's an update based on presence of id
      const isUpdate =
        payload.id !== null && payload.id !== undefined && payload.id !== "";

      console.log(`📝 Operation Type: ${isUpdate ? "UPDATE" : "CREATE"}`);

      // Build custom headers from config
      const customHeaders: Record<string, string> = {};

      console.log("\n" + "=".repeat(60));
      console.log("📤 HEADERS BEING SENT:");
      console.log("=".repeat(60));

      if (
        (currentPopupButton.value as any)?.headers &&
        Array.isArray((currentPopupButton.value as any).headers)
      ) {
        (currentPopupButton.value as any).headers.forEach(
          (headerConfig: any) => {
            const headerName = headerConfig.name;
            let headerValue: any;

            if (headerConfig.value) {
              // Static value
              headerValue = headerConfig.value;
            } else if (headerConfig.field) {
              // Dynamic value from form data or payload
              headerValue =
                (formData as Record<string, any>)[headerConfig.field] ||
                (payload as Record<string, any>)[headerConfig.field];
            } else if (headerConfig.payloadField) {
              // Value from transformed payload
              headerValue = (payload as Record<string, any>)[
                headerConfig.payloadField
              ];
            }

            if (headerValue !== undefined && headerValue !== null) {
              customHeaders[headerName] = String(headerValue);
              console.log(`✅ ${headerName}: ${headerValue}`);
            }
          }
        );
      }

      console.log("=".repeat(60) + "\n");

      // Clean payload - for mapping updates, payload should already be clean
      // For other operations, remove React internals and non-serializable objects
      const cleanPayload = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== "object") return obj;
        if (obj instanceof Date) return obj.toISOString();
        if (obj instanceof Array) return obj.map(cleanPayload);
        if (typeof obj.toJSON === "function") return obj.toJSON();

        const cleaned: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            // Skip React internals, functions, and DOM elements
            if (
              typeof value === "function" ||
              key.startsWith("_react") ||
              key.startsWith("__react") ||
              value instanceof HTMLElement ||
              value instanceof EventTarget ||
              value instanceof Event
            ) {
              continue;
            }
            cleaned[key] = cleanPayload(value);
          }
        }
        return cleaned;
      };

      const cleanedPayload = cleanPayload(payload);
      console.log("✅ Final Payload to Send:", safeStringify(cleanedPayload));

      // Import the dynamic request helper
      const { dynamicRequest } = await import("@/services/apiClient");

      // Use dynamic method from JSON config with custom headers - pass CLEANED payload
      const response = await dynamicRequest(submitUrl, method, cleanedPayload, {
        headers: customHeaders,
      });

      console.log("✅ API Response:", response);

      // Check for success - handles both normal responses and 204 No Content
      const isSuccess =
        (response as any)?.success ||
        (response as any)?.status === 204 ||
        (response as any)?.code === 200 ||
        (response as any)?.data !== undefined;

      if (!isSuccess) {
        throw new Error("Unexpected response format from server");
      }

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

      // If we're in TabsViewer, also refresh the active tab data
      if (activeTab && layoutData.value?.tabs) {
        const activeTabConfig = layoutData.value.tabs.find(
          (t: any) => t.tabId === activeTab
        );
        if (activeTabConfig?.getDataUrl) {
          console.log(
            `🔄 Refreshing tab data for ${activeTab} after submission`
          );
          try {
            // Use the current page from pagination state, or default to 0
            const currentPage = tabPagination[activeTab]?.currentPage ?? 0;
            await handleTabChange(
              activeTab,
              activeTabConfig.getDataUrl,
              currentPage
            );
            console.log(`✅ Tab data refreshed for ${activeTab}`);
          } catch (tabRefreshError) {
            console.error(`⚠️  Could not refresh tab data:`, tabRefreshError);
          }
        }
      }

      closePopup();
      setFormData({});
      setSelectedOptions({});
      setDisplayOrderValues({});
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

  const handlePageChange = async (newPage: number) => {
    setCurrentPage(newPage);

    const layout = layoutData.value;
    if (!layout?.getDataUrl) return;

    // Determine if we're in search mode or normal pagination mode
    const isSearchMode = searchResults !== null;
    const apiUrl = isSearchMode
      ? layout.search?.searchActionUrl
      : layout.getDataUrl;

    if (!apiUrl) return;

    // Build parameters
    const params: Record<string, string> = {
      level: "SYSTEM",
      pageNo: String(newPage),
      pageSize: String(pagination.value.pageSize),
    };

    // If in search mode, include all search fields
    if (isSearchMode && layout.search?.fields) {
      layout.search.fields.forEach((field: any) => {
        const value = (searchData as Record<string, any>)[field.value];
        params[field.value] = value || "";
      });
    }

    console.log("📄 Pagination request params:", params);

    try {
      const { dynamicRequest } = await import("@/services/apiClient");
      const method = isSearchMode ? layout.search?.method || "GET" : "GET";

      const response = await dynamicRequest(apiUrl, method, undefined, {
        params,
      });

      console.log("📦 Pagination response:", response);

      // Handle wrapped response
      let responseData: any = response;
      if (
        (response as any)?.data &&
        typeof (response as any).data === "object"
      ) {
        responseData = (response as any).data;
      }

      let results = [];
      let paginationInfo: any = {};

      if (
        (responseData as any)?.content &&
        Array.isArray((responseData as any).content)
      ) {
        results = (responseData as any).content;
        paginationInfo = {
          currentPage: (responseData as any).number ?? 0,
          pageSize: (responseData as any).size ?? 10,
          totalPages: (responseData as any).totalPages ?? 1,
          totalElements: (responseData as any).totalElements ?? 0,
        };
      } else if (
        (responseData as any)?.data &&
        Array.isArray((responseData as any).data)
      ) {
        results = (responseData as any).data;
      } else if (Array.isArray(responseData)) {
        results = responseData;
      }

      // Update the appropriate data based on mode
      if (isSearchMode) {
        setSearchResults(results);
      } else {
        tableData.value = results;
      }

      // Update pagination info
      if (Object.keys(paginationInfo).length > 0) {
        pagination.value = paginationInfo;
      }
    } catch (error) {
      console.error("❌ Pagination error:", error);
      showAlert({
        title: "Pagination Failed",
        description:
          error instanceof Error ? error.message : "Failed to fetch page",
        variant: "destructive",
      });
    }
  };

  // Handle page size change
  const handlePageSizeChange = async (newPageSize: number) => {
    // Reset to first page when page size changes
    setCurrentPage(0);

    const layout = layoutData.value;
    if (!layout?.getDataUrl) return;

    // Determine if we're in search mode or normal pagination mode
    const isSearchMode = searchResults !== null;
    const apiUrl = isSearchMode
      ? layout.search?.searchActionUrl
      : layout.getDataUrl;

    if (!apiUrl) return;

    // Build parameters with new page size
    const params: Record<string, string> = {
      level: "SYSTEM",
      pageNo: "0",
      pageSize: String(newPageSize),
    };

    // If in search mode, include all search fields
    if (isSearchMode && layout.search?.fields) {
      layout.search.fields.forEach((field: any) => {
        const value = (searchData as Record<string, any>)[field.value];
        params[field.value] = value || "";
      });
    }

    console.log("📄 Page size change request params:", params);

    try {
      const { dynamicRequest } = await import("@/services/apiClient");
      const method = isSearchMode ? layout.search?.method || "GET" : "GET";

      const response = await dynamicRequest(apiUrl, method, undefined, {
        params,
      });

      console.log("📦 Page size change response:", response);

      // Handle wrapped response
      let responseData: any = response;
      if (
        (response as any)?.data &&
        typeof (response as any).data === "object"
      ) {
        responseData = (response as any).data;
      }

      let results = [];
      let paginationInfo: any = {};

      if (
        (responseData as any)?.content &&
        Array.isArray((responseData as any).content)
      ) {
        results = (responseData as any).content;
        paginationInfo = {
          currentPage: 0,
          pageSize: newPageSize,
          totalPages: (responseData as any).totalPages ?? 1,
          totalElements: (responseData as any).totalElements ?? 0,
        };
      } else if (
        (responseData as any)?.data &&
        Array.isArray((responseData as any).data)
      ) {
        results = (responseData as any).data;
        paginationInfo = {
          currentPage: 0,
          pageSize: newPageSize,
          totalPages: 1,
          totalElements: results.length,
        };
      } else if (Array.isArray(responseData)) {
        results = responseData;
        paginationInfo = {
          currentPage: 0,
          pageSize: newPageSize,
          totalPages: 1,
          totalElements: results.length,
        };
      }

      // Update the appropriate data based on mode
      if (isSearchMode) {
        setSearchResults(results);
      } else {
        tableData.value = results;
      }

      // Update pagination info
      pagination.value = paginationInfo;
    } catch (error) {
      console.error("❌ Page size change error:", error);
      showAlert({
        title: "Failed to Change Page Size",
        description:
          error instanceof Error ? error.message : "Failed to fetch data",
        variant: "destructive",
      });
    }
  };

  const handleSearch = async () => {
    const layout = layoutData.value;
    if (!layout?.search?.searchActionUrl) {
      console.log("❌ No search action URL configured");
      return;
    }

    // Build search parameters - INCLUDE ALL FIELDS (even empty ones) + level
    const searchParams: Record<string, string> = {
      level: "SYSTEM",
      pageNo: "0",
      pageSize: String(pagination.value.pageSize),
    };

    // Add ALL search fields (including empty ones)
    if (layout.search.fields) {
      layout.search.fields.forEach((field: any) => {
        const value = (searchData as Record<string, any>)[field.value];
        searchParams[field.value] = value || "";
      });
    }

    console.log("🔍 Search Params:", searchParams);
    setIsSearching(true);

    try {
      // Get the HTTP method from config (default to GET)
      const searchMethod = layout.search.method || "GET";
      console.log(`🔧 Search Method: ${searchMethod}`);

      // Import dynamic request helper
      const { dynamicRequest } = await import("@/services/apiClient");

      // Use dynamic method from JSON config
      const response = await dynamicRequest(
        layout.search.searchActionUrl,
        searchMethod,
        undefined,
        {
          params: searchParams,
        }
      );

      console.log("📦 Search Response:", response);

      let results = [];
      let paginationInfo: any = {};

      if (
        (response as any)?.content &&
        Array.isArray((response as any).content)
      ) {
        results = (response as any).content;
        paginationInfo = {
          currentPage: (response as any).number ?? 0,
          pageSize: (response as any).size ?? 10,
          totalPages: (response as any).totalPages ?? 1,
          totalElements: (response as any).totalElements ?? 0,
        };
      } else if (
        (response as any)?.data &&
        Array.isArray((response as any).data)
      ) {
        results = (response as any).data;
      } else if (Array.isArray(response)) {
        results = response;
      } else if (
        (response as any)?.results &&
        Array.isArray((response as any).results)
      ) {
        results = (response as any).results;
      }

      setSearchResults(results);
      setCurrentPage(0);

      // Update pagination signal with new data
      if (Object.keys(paginationInfo).length > 0) {
        pagination.value = paginationInfo;
      }

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

  // Tab-specific search handler (supports both TABS view and DROPDOWN_VIEW)
  const handleTabSearch = async (
    selectedViewOrTab?: string,
    searchValue?: string
  ) => {
    // Determine if this is for DROPDOWN_VIEW or TABS view
    let activeTabConfig: any;
    let tabId: string;

    if (layoutData.value?.type === "DROPDOWN_VIEW") {
      // For DROPDOWN_VIEW, use the selectedViewOrTab parameter (view key)
      tabId = selectedViewOrTab || activeTab || "";
      if (!tabId || !layoutData.value?.views) {
        console.log("❌ No view selected or no views configured");
        return;
      }
      activeTabConfig = layoutData.value.views[tabId];
    } else {
      // For TABS view, use activeTab
      if (!activeTab || !layoutData.value?.tabs) {
        console.log("❌ No active tab found");
        return;
      }
      tabId = activeTab;
      activeTabConfig = layoutData.value.tabs.find(
        (t: any) => t.tabId === activeTab
      );
    }

    if (!activeTabConfig?.search?.searchActionUrl) {
      console.log(`❌ No search action URL configured for ${tabId}`);
      return;
    }

    // Build search parameters - INCLUDE ALL FIELDS (even empty ones) + level
    const searchParams: Record<string, string> = {
      level: "SYSTEM",
      pageNo: "0",
      pageSize: "100",
    };

    // Add ALL search fields (including empty ones)
    if (activeTabConfig.search.fields) {
      activeTabConfig.search.fields.forEach((field: any) => {
        const value = (searchData as Record<string, any>)[field.value];
        searchParams[field.value] = value || "";
      });
    }

    console.log(`🔍 Search Params for ${tabId}:`, searchParams);
    console.log(
      `📍 Search Action URL: ${activeTabConfig.search.searchActionUrl}`
    );
    setIsSearching(true);

    try {
      // Get the HTTP method from config (default to GET)
      const searchMethod = activeTabConfig.search.method || "GET";
      console.log(`🔧 Search Method: ${searchMethod}`);

      // Import dynamic request helper
      const { dynamicRequest } = await import("@/services/apiClient");

      // Use dynamic method from JSON config
      const response = await dynamicRequest(
        activeTabConfig.search.searchActionUrl,
        searchMethod,
        undefined,
        {
          params: searchParams,
        }
      );

      console.log(`📦 Search Response for ${tabId}:`, response);

      let results = [];
      let paginationInfo: any = {};

      // Handle wrapped response with pagination
      let responseData: any = response;
      if (
        (response as any)?.data &&
        typeof (response as any).data === "object"
      ) {
        responseData = (response as any).data;
      }

      if (
        (responseData as any)?.content &&
        Array.isArray((responseData as any).content)
      ) {
        results = (responseData as any).content;
        paginationInfo = {
          currentPage: (responseData as any).number ?? 0,
          pageSize: (responseData as any).size ?? 10,
          totalPages: (responseData as any).totalPages ?? 1,
          totalElements: (responseData as any).totalElements ?? 0,
        };
      } else if (
        (responseData as any)?.data &&
        Array.isArray((responseData as any).data)
      ) {
        results = (responseData as any).data;
      } else if (Array.isArray(responseData)) {
        results = responseData;
      } else if (
        (responseData as any)?.results &&
        Array.isArray((responseData as any).results)
      ) {
        results = (responseData as any).results;
      }

      // Update the specific tab's data with search results
      setTabsData((prev) => ({ ...prev, [tabId]: results }));
      setCurrentPage(0);

      // Update pagination signal with new data
      if (Object.keys(paginationInfo).length > 0) {
        pagination.value = paginationInfo;
      }

      showAlert({
        title: "Search Complete",
        description: `Found ${results.length} result${
          results.length !== 1 ? "s" : ""
        }`,
      });
    } catch (error) {
      console.error(`❌ Search error for ${tabId}:`, error);
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

  const clearTabSearch = async (selectedViewOrTab?: string) => {
    console.log(`🧹 Clear button clicked for view: ${selectedViewOrTab}`);
    setSearchData({});
    let activeTabConfig: any;
    let tabId: string;

    if (layoutData.value?.type === "DROPDOWN_VIEW") {
      tabId = selectedViewOrTab || activeTab || "";
      if (tabId && layoutData.value?.views) {
        activeTabConfig = layoutData.value.views[tabId];
      }
    } else {
      tabId = activeTab || "";
      if (layoutData.value?.tabs) {
        activeTabConfig = layoutData.value.tabs.find(
          (t: any) => t.tabId === tabId
        );
      }
    }

    if (activeTabConfig?.getDataUrl) {
      // Use handleTabChange to refetch with pagination (page 0)
      console.log(`🔄 Clearing search and refetching: ${tabId}`);
      console.log(`📍 Fetching from URL: ${activeTabConfig.getDataUrl}`);
      await handleTabChange(tabId, activeTabConfig.getDataUrl, 0);

      showAlert({
        title: "Search Cleared",
        description: "Showing all records",
      });
    } else {
      console.warn(`⚠️ No getDataUrl found for ${tabId}`);
    }
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

  const totalPages = pagination.value.totalPages;
  const pageSize = pagination.value.pageSize;
  const totalItems = pagination.value.totalElements;

  const paginatedData = displayData;

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
        {(currentPopupButton.value as any)?.popupLayout === "dual-section" ? (
          <DualSectionPopup
            open={popupOpen.value}
            onClose={closePopup}
            button={currentPopupButton.value}
            onSubmit={handlePopupSubmit}
            isSubmitting={isSubmitting}
          />
        ) : (
          <FormPopup
            open={popupOpen.value}
            onClose={closePopup}
            button={currentPopupButton.value}
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={handlePopupSubmit}
            isSubmitting={isSubmitting}
            onSelectedOptionsChange={setSelectedOptions}
            displayOrderValues={displayOrderValues}
            onDisplayOrderValuesChange={setDisplayOrderValues}
          />
        )}

        <JsonViewPopup
          open={jsonPopupOpen}
          onClose={() => setJsonPopupOpen(false)}
          data={jsonPopupData}
        />
        {isAuditTrailPopup ? (
          <AuditTrailPopup
            open={viewDetailsOpen}
            onClose={() => {
              setViewDetailsOpen(false);
              setIsAuditTrailPopup(false);
            }}
            data={viewDetailsData}
            title="Audit Trail"
            currentPage={auditTrailPagination.currentPage}
            totalPages={auditTrailPagination.totalPages}
            totalElements={auditTrailPagination.totalElements}
            pageSize={auditTrailPagination.pageSize}
            isLoading={auditTrailPagination.isLoading}
            onPageChange={handleAuditPageChange}
          />
        ) : (
          <ViewDetailsPopup
            open={viewDetailsOpen}
            onClose={() => setViewDetailsOpen(false)}
            data={viewDetailsData}
            title="View Details"
          />
        )}

        {/* Advanced Search Dialog */}
        <AdvancedSearchDialog
          open={advancedSearchOpen}
          onClose={() => setAdvancedSearchOpen(false)}
          layout={layout}
          searchData={searchData}
          onSearchDataChange={setSearchData}
          onSearch={handleSearch}
          onClear={clearSearch}
          isSearching={isSearching}
        />

        <div className="flex items-center justify-between border-b py-4 bg-background">
          {layoutData.value?.type === "DUAL_SECTION_VIEW" &&
          layoutData.value?.leftSection &&
          layoutData.value?.rightSection ? (
            <>
              {console.log(
                `[Render] 🎯 Rendering DualSectionView for ${layoutData.value.title}`
              )}
              <DualSectionView
                title={layoutData.value.title}
                description={layoutData.value.description}
                icon={layoutData.value.icon}
                leftSection={layoutData.value.leftSection}
                rightSection={layoutData.value.rightSection}
                actions={layoutData.value.actions}
                submitUrl={layoutData.value.submitUrl}
                submitText={layoutData.value.submitText}
                method={layoutData.value.method}
                onSuccess={() => {
                  console.log("[DualSectionView] Mapping created successfully");
                  // Optional: Refresh any related data if needed
                }}
              />
            </>
          ) : layoutData.value?.type === "DROPDOWN_VIEW" &&
            layoutData.value?.dropdownSelector &&
            layoutData.value?.views ? (
            <>
              {console.log(
                `[Render] 🎯 Rendering DropdownTableView with dropdown views`
              )}
              <DropdownTableView
                dropdownSelector={layoutData.value.dropdownSelector}
                views={layoutData.value.views}
                onTabChange={handleTabChange}
                onRowAction={handleRowAction}
                onButtonClick={handleButtonClick}
                onViewJson={handleViewJson}
                CellRenderer={CellRenderer}
                tabPagination={tabPagination}
                onPageChange={handleTabPageChange}
                searchData={searchData}
                onSearchDataChange={setSearchData}
                onSearch={handleTabSearch}
                onClear={clearTabSearch}
                isSearching={isSearching}
                tabsData={tabsData}
                loadingTabs={loadingTabs}
                tabErrors={tabErrors}
              />
            </>
          ) : layoutData.value?.type === "TABS" && layoutData.value?.tabs ? (
            <>
              {console.log(
                `[Render] 🎯 Rendering TabsViewer with ${layoutData.value.tabs.length} tabs`
              )}
              <TabsViewer
                tabs={layoutData.value.tabs}
                activeTab={activeTab}
                tabsData={tabsData}
                loadingTabs={loadingTabs}
                tabErrors={tabErrors}
                title={currentContentItem.value?.title || "Mappings"}
                onTabChange={handleTabChange}
                onRowAction={handleRowAction}
                onButtonClick={handleButtonClick}
                onViewJson={handleViewJson}
                CellRenderer={CellRenderer}
                searchData={searchData}
                onSearchDataChange={setSearchData}
                onSearch={handleTabSearch}
                onClear={clearTabSearch}
                isSearching={isSearching}
                tabPagination={tabPagination}
                onPageChange={handleTabPageChange}
              />
            </>
          ) : (
            <>
              {console.log(
                `[Render] 📋 Rendering Standard View - type: ${
                  layoutData.value?.type
                }, has tabs: ${!!layoutData.value?.tabs}`
              )}
              <SearchBar
                layout={layout}
                searchData={searchData}
                onSearchDataChange={setSearchData}
                onSearch={handleSearch}
                onClear={clearSearch}
                isSearching={isSearching}
                onAdvancedSearchOpen={() => setAdvancedSearchOpen(true)}
              />

              <ActionButtons
                buttons={layout?.buttons}
                onButtonClick={handleButtonClick}
              />

              {layout?.auditButton && (
                <div className="px-6 py-3 flex items-center gap-2">
                  <Button
                    onClick={() => handleAuditButtonClick(layout.auditButton)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {layout.auditButton.icon && (
                      <DynamicIcon name={layout.auditButton.icon} />
                    )}
                    {layout.auditButton.label}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex-1 overflow-y-auto w-full space-y-6">
          {layoutData.value?.type !== "TABS" && (
            <>
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
                <div className="rounded-lg border bg-card">
                  {tableDataLoading.value ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {layout.tableHeaders
                            .sort(
                              (a: any, b: any) =>
                                (a.order || 999) - (b.order || 999)
                            )
                            .map((header: any, index: number) => (
                              <TableHead key={index}>{header.Header}</TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[...Array(10)].map((_: any, i: number) => (
                          <TableRow key={i}>
                            {layout.tableHeaders.map((_: any, j: number) => (
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
                            {layout.tableHeaders
                              .sort(
                                (a: any, b: any) =>
                                  (a.order || 999) - (b.order || 999)
                              )
                              .map((header: any, index: number) => (
                                <TableHead key={index}>
                                  {header.Header}
                                </TableHead>
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
                                    (a: any, b: any) =>
                                      (a.order || 999) - (b.order || 999)
                                  )
                                  .map((header: any, colIndex: number) => {
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
                                                (
                                                  action: any,
                                                  actionIndex: number
                                                ) => {
                                                  // Handle STATUS_TOGGLE placeholder replacement
                                                  let displayTitle =
                                                    action.title;
                                                  let buttonClassName = "";

                                                  if (
                                                    action.type ===
                                                    "STATUS_TOGGLE"
                                                  ) {
                                                    const statusField =
                                                      action.statusField ||
                                                      "isActive";
                                                    const currentStatus =
                                                      row[statusField];
                                                    const oppositeStatus =
                                                      !currentStatus;
                                                    const activeLabel =
                                                      action.activeLabel ||
                                                      "Active";
                                                    const inactiveLabel =
                                                      action.inactiveLabel ||
                                                      "Inactive";
                                                    displayTitle =
                                                      oppositeStatus
                                                        ? activeLabel
                                                        : inactiveLabel;

                                                    // Add color based on what the button will do (opposite of current status)
                                                    if (oppositeStatus) {
                                                      // Will activate - show green
                                                      buttonClassName =
                                                        "text-green-600 hover:text-green-700 hover:bg-green-50";
                                                    } else {
                                                      // Will deactivate - show red
                                                      buttonClassName =
                                                        "text-red-500 hover:text-red-700 hover:bg-red-50";
                                                    }
                                                  }

                                                  return (
                                                    <DropdownMenuItem
                                                      key={actionIndex}
                                                      className={
                                                        buttonClassName
                                                      }
                                                      onClick={() =>
                                                        handleRowAction(
                                                          action,
                                                          row
                                                        )
                                                      }
                                                    >
                                                      {displayTitle}
                                                    </DropdownMenuItem>
                                                  );
                                                }
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
                                          rowData={row}
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

                      {/* Pagination */}
                      {totalPages > 0 && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          pageSize={pageSize}
                          totalItems={totalItems}
                          isSearchResults={searchResults !== null || hasSearchCriteria}
                          onPageChange={handlePageChange}
                          onPageSizeChange={handlePageSizeChange}
                        />
                      )}
                    </>
                  )}
                </div>
              )}

              {!layout && !layoutLoading.value && !layoutError.value && (
                <Card className="m-6">
                  <CardContent className="flex min-h-50 items-center justify-center">
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
            </>
          )}
        </div>
      </div>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {confirmDialogData && (
              <>
                {/* Item Details */}
                <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                  {confirmDialogData.rowData.code && (
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">
                        Code:
                      </span>
                      <span className="text-sm font-semibold">
                        {confirmDialogData.rowData.code}
                      </span>
                    </div>
                  )}
                  {confirmDialogData.rowData.name && (
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-muted-foreground">
                        Name:
                      </span>
                      <span className="text-sm font-semibold">
                        {confirmDialogData.rowData.name}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-start pt-2 border-t">
                    <span className="text-sm font-medium text-muted-foreground">
                      New Status:
                    </span>
                    <span
                      className={`text-sm font-bold ${
                        confirmDialogData.newStatus
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {confirmDialogData.newStatus
                        ? confirmDialogData.activeLabel
                        : confirmDialogData.inactiveLabel}
                    </span>
                  </div>
                </div>

                {/* Warning Message */}
                <p className="text-sm text-muted-foreground">
                  This action will{" "}
                  {confirmDialogData.newStatus ? "activate" : "deactivate"} the
                  item.
                </p>
              </>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDialogOpen(false);
                setConfirmDialogData(null);
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmStatusToggle}
              disabled={isSubmitting}
              className={
                confirmDialogData?.newStatus
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pendingDelete?.action?.confirmTitle || "Confirm Delete"}
            </DialogTitle>
            <DialogDescription>
              {pendingDelete?.action?.confirmMessage ||
                "Are you sure you want to delete this item?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteConfirmOpen(false);
                setPendingDelete(null);
              }}
              disabled={isSubmitting}
            >
              {pendingDelete?.action?.cancelButtonText || "Cancel"}
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!pendingDelete) return;

                const { action, rowData } = pendingDelete;

                // Replace URL variables like {examGradeMappingId} with actual values from row data
                let deleteUrl = action.actionUrl;
                deleteUrl = deleteUrl.replace(
                  /\{(\w+)\}/g,
                  (match: string, variable: string) => {
                    // Try exact match first
                    let value = rowData[variable];

                    // If not found, try alternative mappings
                    if (value === undefined || value === null) {
                      // Try removing "Id" suffix
                      if (variable.endsWith("Id")) {
                        const altKey = variable.slice(0, -2);
                        value = rowData[altKey];
                      }
                      // Try looking for "id" if it's a MappingId pattern
                      if (
                        (value === undefined || value === null) &&
                        variable.endsWith("MappingId")
                      ) {
                        value = rowData["id"];
                      }
                    }

                    if (value === undefined || value === null) {
                      console.warn(
                        `⚠️ Variable ${variable} not found in rowData`
                      );
                      return match;
                    }
                    console.log(
                      `✅ Replacing {${variable}} with "${value}" from rowData`
                    );
                    return String(value);
                  }
                );

                console.log(`🗑️ Delete URL: ${deleteUrl}`);

                // Make DELETE request
                setIsSubmitting(true);
                try {
                  const { dynamicRequest } = await import(
                    "@/services/apiClient"
                  );
                  const method = action.method || "DELETE";
                  console.log(`🔧 Using HTTP Method: ${method}`);

                  const response = await dynamicRequest(deleteUrl, method);
                  console.log("✅ Delete Response:", response);

                  showAlert({
                    title: "Success",
                    description: "Deleted successfully",
                  });

                  // Close the dialog
                  setDeleteConfirmOpen(false);
                  setPendingDelete(null);

                  // Refresh the table data
                  if (layoutData.value?.getDataUrl) {
                    await fetchTableData(layoutData.value.getDataUrl);
                    console.log("✅ Table data refreshed");
                  }

                  // If we're in TabsViewer, also refresh the active tab data
                  if (activeTab && layoutData.value?.tabs) {
                    const activeTabConfig = layoutData.value.tabs.find(
                      (t: any) => t.tabId === activeTab
                    );
                    if (activeTabConfig?.getDataUrl) {
                      console.log(`🔄 Refreshing tab data for ${activeTab} after deletion`);
                      try {
                        const currentPage = tabPagination[activeTab]?.currentPage ?? 0;
                        await handleTabChange(activeTab, activeTabConfig.getDataUrl, currentPage);
                        console.log(`✅ Tab data refreshed for ${activeTab}`);
                      } catch (tabRefreshError) {
                        console.error(`⚠️ Could not refresh tab data:`, tabRefreshError);
                      }
                    }
                  }
                } catch (error: any) {
                  console.error("❌ Delete error:", error);
                  showAlert({
                    title: "Error",
                    description:
                      error instanceof Error
                        ? error.message
                        : "Failed to delete",
                    variant: "destructive",
                  });
                } finally {
                  setIsSubmitting(false);
                }
              }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Deleting..."
                : pendingDelete?.action?.confirmButtonText || "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}