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
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { DynamicIcon } from "@/lib/icon-map";
import { TabsViewer } from "@/components/TabsViewer";
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
  fetchTableData,
  popupOpen,
  currentPopupButton,
  openPopup,
  closePopup,
} from "@/signals/dynamicContent";
import { postData, putData } from "@/services/apiClient";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ViewDetailsPopup } from "@/components/ViewDetailsPopup";

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
        className={`max-w-[150px] break-all font-mono font-semibold text-primary ${
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

  const isImageUrl = (str) => {
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
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>(
    {}
  );
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>(
    {}
  );
  const [languageOptions, setLanguageOptions] = useState<any[]>([]);
  const [loadingLanguages, setLoadingLanguages] = useState(false);
  const [expandedTranslations, setExpandedTranslations] = useState<
    Record<string, boolean>
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
          const response = await dynamicRequest(field.languagesUrl, "GET");

          let languages = [];
          if ((response as any)?.data && Array.isArray((response as any).data)) {
            languages = (response as any).data;
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
          const response = await dynamicRequest(field.fetchOptionsUrl, "GET");

          let options = [];
          if ((response as any)?.data && Array.isArray((response as any).data)) {
            options = (response as any).data;
          } else if (Array.isArray(response)) {
            options = response;
          }

          // Transform options to have both label and value
          const transformedOptions = options.map((opt: any) => ({
            value: opt[field.optionValueKey] || opt.id,
            label: opt[field.optionLabelKey] || opt.name || String(opt),
            original: opt,
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
            {button?.popupFields?.map((field, index) => (
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
                        field.selectOptions.map((option, idx) => (
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
                  <div className="border rounded-md p-2 max-h-48 overflow-y-auto">
                    {loadingOptions[field.value] ? (
                      <div className="text-center text-sm text-muted-foreground py-4">
                        Loading...
                      </div>
                    ) : (dropdownOptions[field.value] || []).length > 0 ? (
                      (dropdownOptions[field.value] || []).map(
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
                                  ? formData[field.value].includes(option.value)
                                  : false
                              }
                              onChange={(e) => {
                                const current = Array.isArray(
                                  formData[field.value]
                                )
                                  ? formData[field.value]
                                  : [];
                                const updated = e.target.checked
                                  ? [...current, option.value]
                                  : current.filter((v) => v !== option.value);
                                onFormDataChange({
                                  ...formData,
                                  [field.value]: updated,
                                });
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
                      )
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
// ============================================
// 3A. Advanced Search Dialog Component
// ============================================
// @ts-ignore
const AdvancedSearchDialog = ({
  open,
  onClose,
  layout,
  searchData,
  onSearchDataChange,
  onSearch,
  onClear,
  isSearching,
}) => {
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
          const response = await dynamicRequest(field.fetchOptionsUrl, "GET");

          let options = [];
          if ((response as any)?.data && Array.isArray((response as any).data)) {
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
          {layout?.search?.fields?.map((field, index) => (
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
                        .filter((option) => option.value !== "")
                        .map((option, idx) => (
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
// @ts-ignore
const SearchBar = ({
  layout,
  searchData,
  onSearchDataChange,
  onSearch,
  onClear,
  isSearching,
  onAdvancedSearchOpen,
}) => {
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
          const response = await dynamicRequest(field.fetchOptionsUrl, "GET");

          let options = [];
          if ((response as any)?.data && Array.isArray((response as any).data)) {
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
        {visibleFields.map((field, index) => (
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
                    (dropdownOptions[field.value] || []).map((option, idx) => (
                      <SelectItem key={idx} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))
                  ) : field.selectOptions?.length > 0 ? (
                    field.selectOptions
                      .filter((option) => option.value !== "")
                      .map((option, idx) => (
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
          <span className="ml-1 text-cyan-600">(search results)</span>
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
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [jsonPopupOpen, setJsonPopupOpen] = useState(false);
  const [jsonPopupData, setJsonPopupData] = useState<any>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [viewDetailsData, setViewDetailsData] = useState<any>(null);
  const [advancedSearchOpen, setAdvancedSearchOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("");
  const [tabsData, setTabsData] = useState<Record<string, any[]>>({});
  const [loadingTabs, setLoadingTabs] = useState<Record<string, boolean>>({});
  const [tabErrors, setTabErrors] = useState<Record<string, string>>({});

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
      fullData: layoutData.value
    });
    
    if (
      layoutData.value?.type === "TABS" &&
      layoutData.value?.tabs?.length > 0
    ) {
      console.log(`[TabsInitEffect] ✅ TABS layout detected, initializing first tab`);
      const firstTab = layoutData.value.tabs[0];
      setActiveTab(firstTab.tabId);
      setTabsData({});
      setLoadingTabs({});
      setTabErrors({});
      // Fetch first tab data
      handleTabChange(firstTab.tabId, firstTab.getDataUrl);
    } else {
      console.log(`[TabsInitEffect] ❌ Layout is not TABS type or no tabs array`);
    }
  }, [layoutData.value]);

  // Handle pagination changes - re-run search when page changes

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

  const handleTabChange = async (tabId: string, getDataUrl: string) => {
    // Check if we already have the data cached
    if (tabsData[tabId]) {
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
        params: { level: "SYSTEM", pageNo: "0", pageSize: "100" },
      });

      console.log(`📦 Tab ${tabId} Response:`, response);

      // Handle wrapped response
      let responseData: any = response;
      if ((response as any)?.data && typeof (response as any).data === "object") {
        responseData = (response as any).data;
      }

      let results = [];

      if (responseData?.content && Array.isArray(responseData.content)) {
        results = responseData.content;
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        results = responseData.data;
      } else if (Array.isArray(responseData)) {
        results = responseData;
      }

      setTabsData((prev) => ({ ...prev, [tabId]: results }));
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

  const handleRowAction = (action: any, rowData: any) => {
    // Handle VIEW action
    if (action.type === "link" || action.title?.toLowerCase() === "view") {
      console.log("🔍 Opening view details for:", rowData);
      setViewDetailsData(rowData);
      setViewDetailsOpen(true);
      return;
    }

    // Handle SHOW_POPUP action (Edit)
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

  const handlePopupSubmit = async () => {
    if (!currentPopupButton.value) return;

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

    // 🔥 NEW: Replace URL variables like {id} with actual values from formData
    submitUrl = submitUrl.replace(/\{(\w+)\}/g, (match, variable) => {
      const value = formData[variable];
      if (value === undefined || value === null) {
        console.warn(`⚠️ Variable ${variable} not found in formData`);
        return match; // Keep the placeholder if value not found
      }
      console.log(`✅ Replacing {${variable}} with "${value}"`);
      return String(value);
    });

    console.log(`📍 Final URL: ${submitUrl}`);

    setIsSubmitting(true);

    try {
      const payload = transformFormDataToPayload(
        formData,
        currentPopupButton.value.popupFields || []
      );

      console.log("📦 Payload Being Sent:", JSON.stringify(payload, null, 2));

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
        currentPopupButton.value?.headers &&
        Array.isArray(currentPopupButton.value.headers)
      ) {
        currentPopupButton.value.headers.forEach((headerConfig: any) => {
          const headerName = headerConfig.name;
          let headerValue: any;

          if (headerConfig.value) {
            // Static value
            headerValue = headerConfig.value;
          } else if (headerConfig.field) {
            // Dynamic value from form data or payload
            headerValue =
              formData[headerConfig.field] || payload[headerConfig.field];
          } else if (headerConfig.payloadField) {
            // Value from transformed payload
            headerValue = payload[headerConfig.payloadField];
          }

          if (headerValue !== undefined && headerValue !== null) {
            customHeaders[headerName] = String(headerValue);
            console.log(`✅ ${headerName}: ${headerValue}`);
          }
        });
      }

      console.log("=".repeat(60) + "\n");

      // Import the dynamic request helper
      const { dynamicRequest } = await import("@/services/apiClient");

      // Use dynamic method from JSON config with custom headers
      const response = await dynamicRequest(submitUrl, method, payload, {
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
      layout.search.fields.forEach((field) => {
        const value = searchData[field.value];
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
      if ((response as any)?.data && typeof (response as any).data === "object") {
        responseData = (response as any).data;
      }

      let results = [];
      let paginationInfo: any = {};

      if (responseData?.content && Array.isArray(responseData.content)) {
        results = responseData.content;
        paginationInfo = {
          currentPage: responseData.number ?? 0,
          pageSize: responseData.size ?? 10,
          totalPages: responseData.totalPages ?? 1,
          totalElements: responseData.totalElements ?? 0,
        };
      } else if (responseData?.data && Array.isArray(responseData.data)) {
        results = responseData.data;
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
      layout.search.fields.forEach((field) => {
        const value = searchData[field.value];
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

      if ((response as any)?.content && Array.isArray((response as any).content)) {
        results = (response as any).content;
        paginationInfo = {
          currentPage: (response as any).number ?? 0,
          pageSize: (response as any).size ?? 10,
          totalPages: (response as any).totalPages ?? 1,
          totalElements: (response as any).totalElements ?? 0,
        };
      } else if ((response as any)?.data && Array.isArray((response as any).data)) {
        results = (response as any).data;
      } else if (Array.isArray(response)) {
        results = response;
      } else if ((response as any).results && Array.isArray((response as any).results)) {
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
        <ViewDetailsPopup
          open={viewDetailsOpen}
          onClose={() => setViewDetailsOpen(false)}
          data={viewDetailsData}
          title="View Coupon Details"
        />

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
          {layoutData.value?.type === "TABS" && layoutData.value?.tabs ? (
            <>
              {console.log(`[Render] 🎯 Rendering TabsViewer with ${layoutData.value.tabs.length} tabs`)}
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
              />
            </>
          ) : (
            <>
              {console.log(`[Render] 📋 Rendering Standard View - type: ${layoutData.value?.type}, has tabs: ${!!layoutData.value?.tabs}`)}
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
                <Card>
                  <CardHeader />
                  <CardContent>
                    <div className="border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {layout.tableHeaders
                              .sort(
                                (a, b) => (a.order || 999) - (b.order || 999)
                              )
                              .map((header, index) => (
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
                                    (a, b) =>
                                      (a.order || 999) - (b.order || 999)
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
                                                      handleRowAction(
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
                    </div>

                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      isSearchResults={searchResults !== null}
                      onPageChange={handlePageChange}
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
