import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Search,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { DynamicIcon } from "@/lib/icon-map";
import { dynamicRequest } from "@/services/apiClient";
import { toast } from "sonner";
import { useSignals } from "@preact/signals-react/runtime";
import {
  layoutData,
  layoutLoading,
  layoutError,
  fetchLayoutData,
} from "@/signals/dynamicContent";

// Default config URL for carousels
const DEFAULT_CONFIG_URL = "/secure/api/v1/dashboard-ui-config/get-by-route?route=/app-carousels";

// Types
interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

// ============================================
// Cell Renderer Component
// ============================================
const CellRenderer = ({
  header,
  value,
  rowData,
}: {
  header: any;
  value: any;
  rowData: any;
}) => {
  if (value === undefined || value === null) return <span className="text-muted-foreground">-</span>;

  const isImageUrl = (str: string): boolean => {
    if (typeof str !== "string") return false;
    return /\.(png|jpg|jpeg|gif|svg|webp)(\?.*)?$/i.test(str);
  };

  // Image type
  if (header.type === "image" || isImageUrl(value)) {
    return (
      <div className="flex h-[60px] w-[100px] overflow-hidden items-center justify-center">
        <img
          src={String(value)}
          alt={header.Header}
          className="w-full h-full object-cover rounded border"
          onError={(e) => {
            e.currentTarget.src = "https://via.placeholder.com/100x60?text=No+Image";
          }}
        />
      </div>
    );
  }

  // Boolean/Status type
  if (header.type === "boolean" || header.displayFormat === "status") {
    const boolValue =
      typeof value === "boolean"
        ? value
        : String(value).toLowerCase() === "true";
    return (
      <Badge variant={boolValue ? "default" : "secondary"}>
        {boolValue ? "Active" : "Inactive"}
      </Badge>
    );
  }

  // Badge type
  if (header.type === "badge") {
    const variants = header.badgeVariants || {};
    const variant = variants[value] || "outline";
    return (
      <Badge variant={variant} className="font-normal">
        {String(value)}
      </Badge>
    );
  }

  // Date/Datetime type
  if (header.type === "date" || header.type === "datetime") {
    try {
      const date = new Date(value);
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: header.type === "datetime" ? "2-digit" : undefined,
            minute: header.type === "datetime" ? "2-digit" : undefined,
          })}
        </span>
      );
    } catch {
      return <span>{String(value)}</span>;
    }
  }

  // Default text
  return <span className="line-clamp-2">{String(value)}</span>;
};

// ============================================
// Key-Value Pair Editor Component (for activityParams)
// ============================================
const KeyValueEditor = ({
  value,
  onChange,
  placeholder,
}: {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  placeholder?: string;
}) => {
  // Convert object to array of {key, value} pairs for editing
  const pairs = Object.entries(value || {}).map(([k, v]) => ({ key: k, value: String(v) }));

  const addPair = () => {
    const newObj = { ...value, "": "" };
    onChange(newObj);
  };

  const removePair = (keyToRemove: string) => {
    const newObj = { ...value };
    delete newObj[keyToRemove];
    onChange(newObj);
  };

  const updatePair = (oldKey: string, newKey: string, newValue: string) => {
    const newObj: Record<string, any> = {};
    Object.entries(value || {}).forEach(([k, v]) => {
      if (k === oldKey) {
        if (newKey) {
          newObj[newKey] = newValue;
        }
      } else {
        newObj[k] = v;
      }
    });
    // If oldKey was empty (new entry), add the new key
    if (oldKey === "" && newKey) {
      newObj[newKey] = newValue;
    }
    onChange(newObj);
  };

  return (
    <div className="space-y-2">
      {pairs.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-3 border rounded-lg border-dashed">
          No parameters. Click "Add" to create one.
        </div>
      ) : (
        pairs.map((pair, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Input
              placeholder="Key"
              value={pair.key}
              onChange={(e) => updatePair(pair.key, e.target.value, pair.value)}
              className="flex-1 h-9"
            />
            <span className="text-muted-foreground">:</span>
            <Input
              placeholder="Value"
              value={pair.value}
              onChange={(e) => updatePair(pair.key, pair.key, e.target.value)}
              className="flex-1 h-9"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive shrink-0"
              onClick={() => removePair(pair.key)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}
      <Button type="button" variant="outline" size="sm" onClick={addPair} className="w-full">
        <Plus className="h-4 w-4 mr-1" />
        Add Parameter
      </Button>
    </div>
  );
};

// ============================================
// Repeater Field Component (for batches array)
// ============================================
const RepeaterField = ({
  field,
  value,
  onChange,
}: {
  field: any;
  value: any[];
  onChange: (value: any[]) => void;
}) => {
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    const newItem: Record<string, any> = {};
    field.fields?.forEach((f: any) => {
      if (f.type === "json" || f.type === "keyvalue") {
        newItem[f.value] = {};
      } else if (f.type === "number") {
        newItem[f.value] = 0;
      } else {
        newItem[f.value] = "";
      }
    });
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, fieldName: string, fieldValue: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [fieldName]: fieldValue };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{field.label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          <Plus className="h-4 w-4 mr-1" />
          Add {field.label?.replace(/s$/, "") || "Item"}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg border-dashed">
          No items added. Click "Add" to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3 bg-muted/30 relative">
              <div className="absolute top-2 right-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => removeItem(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs font-medium text-muted-foreground mb-2">
                #{index + 1}
              </div>

              <div className="grid gap-3 pr-8">
                {field.fields?.map((subField: any, subIdx: number) => (
                  <div key={subIdx} className="grid gap-1">
                    <Label className="text-xs">
                      {subField.label} {subField.required && "*"}
                    </Label>

                    {subField.type === "select" ? (
                      <Select
                        value={String(item[subField.value] || "")}
                        onValueChange={(val) => updateItem(index, subField.value, val)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={subField.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          {subField.selectOptions?.filter((opt: any) => opt.value !== "").map((opt: any, optIdx: number) => (
                            <SelectItem key={optIdx} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : subField.type === "keyvalue" ? (
                      <KeyValueEditor
                        value={typeof item[subField.value] === "object" ? item[subField.value] : {}}
                        onChange={(val) => updateItem(index, subField.value, val)}
                        placeholder={subField.placeholder}
                      />
                    ) : subField.type === "json" ? (
                      <textarea
                        placeholder={subField.placeholder || '{}'}
                        value={
                          typeof item[subField.value] === "object"
                            ? JSON.stringify(item[subField.value], null, 2)
                            : item[subField.value] || "{}"
                        }
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            updateItem(index, subField.value, parsed);
                          } catch {
                            updateItem(index, subField.value, e.target.value);
                          }
                        }}
                        className="w-full min-h-[80px] p-2 border rounded-md font-mono text-xs bg-background resize-y"
                      />
                    ) : subField.type === "number" ? (
                      <Input
                        type="number"
                        placeholder={subField.placeholder}
                        value={item[subField.value] ?? ""}
                        onChange={(e) => updateItem(index, subField.value, Number(e.target.value))}
                        className="h-9"
                      />
                    ) : (
                      <Input
                        type="text"
                        placeholder={subField.placeholder}
                        value={item[subField.value] || ""}
                        onChange={(e) => updateItem(index, subField.value, e.target.value)}
                        className="h-9"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Dynamic Form Field Renderer
// ============================================
const FormFieldRenderer = ({
  field,
  formData,
  onFormDataChange,
  dropdownOptions,
  loadingOptions,
}: {
  field: any;
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  dropdownOptions: Record<string, any[]>;
  loadingOptions: Record<string, boolean>;
}) => {
  const fieldKey = field.value;
  const value = formData[fieldKey];

  // Repeater field (for batches array)
  if (field.type === "repeater") {
    return (
      <RepeaterField
        field={field}
        value={value || []}
        onChange={(val) => onFormDataChange({ ...formData, [fieldKey]: val })}
      />
    );
  }

  // JSON field
  if (field.type === "json") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldKey}>
          {field.label} {field.required && "*"}
        </Label>
        <textarea
          id={fieldKey}
          placeholder={field.placeholder || '{}'}
          value={
            typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : value || "{}"
          }
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onFormDataChange({ ...formData, [fieldKey]: parsed });
            } catch {
              onFormDataChange({ ...formData, [fieldKey]: e.target.value });
            }
          }}
          className="w-full min-h-[120px] p-3 border rounded-md font-mono text-sm bg-background resize-y"
        />
      </div>
    );
  }

  // Key-Value field (for activityParams)
  if (field.type === "keyvalue") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldKey}>
          {field.label} {field.required && "*"}
        </Label>
        <KeyValueEditor
          value={typeof value === "object" ? value : {}}
          onChange={(val) => onFormDataChange({ ...formData, [fieldKey]: val })}
          placeholder={field.placeholder}
        />
      </div>
    );
  }

  // Select field
  if (field.type === "select") {
    const rawOptions = dropdownOptions[fieldKey] || field.selectOptions || [];
    const options = rawOptions.filter((opt: any) =>
      opt.value !== "" && opt.value !== null && opt.value !== undefined
    );

    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldKey}>
          {field.label} {field.required && "*"}
        </Label>
        <Select
          value={String(value ?? "")}
          onValueChange={(val) => {
            let newValue: any = val;
            if (val === "true") newValue = true;
            else if (val === "false") newValue = false;
            onFormDataChange({ ...formData, [fieldKey]: newValue });
          }}
          disabled={loadingOptions[fieldKey] || field.disabled}
        >
          <SelectTrigger id={fieldKey}>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {loadingOptions[fieldKey] ? (
              <div className="p-2 text-center text-sm text-muted-foreground">
                <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : options.length > 0 ? (
              options.map((opt: any, idx: number) => (
                <SelectItem key={idx} value={String(opt.value)}>
                  {opt.label}
                </SelectItem>
              ))
            ) : (
              <div className="p-2 text-center text-sm text-muted-foreground">
                No options available
              </div>
            )}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Multiselect field (comma-separated input)
  if (field.type === "multiselect") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldKey}>
          {field.label} {field.required && "*"}
        </Label>
        <Input
          id={fieldKey}
          placeholder={field.placeholder}
          value={Array.isArray(value) ? value.join(", ") : value || ""}
          onChange={(e) => {
            const vals = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
            onFormDataChange({ ...formData, [fieldKey]: vals.map(Number).filter(n => !isNaN(n)) });
          }}
        />
        <p className="text-xs text-muted-foreground">Enter comma-separated values</p>
      </div>
    );
  }

  // Number field
  if (field.type === "number") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldKey}>
          {field.label} {field.required && "*"}
        </Label>
        <Input
          id={fieldKey}
          type="number"
          placeholder={field.placeholder}
          value={value ?? ""}
          onChange={(e) => onFormDataChange({ ...formData, [fieldKey]: Number(e.target.value) })}
          disabled={field.disabled}
        />
      </div>
    );
  }

  // Default text input
  return (
    <div className="grid gap-2">
      <Label htmlFor={fieldKey}>
        {field.label} {field.required && "*"}
      </Label>
      <Input
        id={fieldKey}
        type="text"
        placeholder={field.placeholder}
        value={value || ""}
        onChange={(e) => onFormDataChange({ ...formData, [fieldKey]: e.target.value })}
        disabled={field.disabled}
      />
    </div>
  );
};

// ============================================
// View Details Popup Component
// ============================================
const ViewDetailsPopup = ({
  open,
  onClose,
  data,
  title,
}: {
  open: boolean;
  onClose: () => void;
  data: any;
  title?: string;
}) => {
  if (!data) return null;

  const renderValue = (key: string, value: any): React.ReactNode => {
    if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;

    if (typeof value === "boolean") {
      return (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Active" : "Inactive"}
        </Badge>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted-foreground">Empty</span>;
      return (
        <div className="space-y-2">
          {value.map((item, idx) => (
            <div key={idx} className="bg-muted/50 p-2 rounded text-xs">
              <pre className="whitespace-pre-wrap break-words">
                {JSON.stringify(item, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      return (
        <pre className="text-xs bg-muted/50 p-2 rounded whitespace-pre-wrap break-words">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }

    return String(value);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title || "Details"}</DialogTitle>
          <DialogDescription>
            {data?.carouselCode || data?.code || data?.id ? `ID: ${data.id}` : "View details"}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Image Preview */}
          {data.url && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <img
                src={data.url}
                alt="Preview"
                className="max-h-48 object-contain mx-auto rounded"
                onError={(e) => {
                  e.currentTarget.src = "https://via.placeholder.com/400x200?text=No+Image";
                }}
              />
            </div>
          )}

          {/* All Fields */}
          <div className="grid gap-3">
            {Object.entries(data).map(([key, value]) => (
              <div key={key} className="grid gap-1">
                <span className="text-sm font-medium text-muted-foreground capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </span>
                <div className="text-sm">{renderValue(key, value)}</div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// Audit Trail Popup Component
// ============================================
const AuditTrailPopup = ({
  open,
  onClose,
  data,
  title,
  pagination,
  onPageChange,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  data: any[];
  title?: string;
  pagination: { currentPage: number; totalPages: number; totalElements: number };
  onPageChange: (page: number) => void;
  isLoading: boolean;
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title || "Audit Trail"}</DialogTitle>
          <DialogDescription>
            View change history ({pagination.totalElements} records)
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading...
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No audit records found
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-muted/30">
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(item, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-sm text-muted-foreground">
              Page {pagination.currentPage + 1} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 0 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages - 1 || isLoading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ============================================
// Main Component
// ============================================
export default function HomePageDynamic() {
  useSignals();

  const config = layoutData.value;
  const configLoading = layoutLoading.value;
  const configError = layoutError.value;

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 0,
    pageSize: 10,
    totalPages: 1,
    totalElements: 0,
  });

  // Search state
  const [searchData, setSearchData] = useState<Record<string, string>>({});

  // Dialog states
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [auditDialogOpen, setAuditDialogOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [viewData, setViewData] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAction, setCurrentAction] = useState<any | null>(null);
  const [confirmDialogData, setConfirmDialogData] = useState<any>(null);

  // Audit trail state
  const [auditData, setAuditData] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditPagination, setAuditPagination] = useState({
    currentPage: 0,
    totalPages: 1,
    totalElements: 0,
    fetchUrl: "",
    entityName: "",
    entityId: "",
  });

  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});

  // Fetch config on mount - always fetch fresh config for this page
  useEffect(() => {
    // Always fetch fresh config when this component mounts
    fetchLayoutData(DEFAULT_CONFIG_URL);
  }, []);

  // Fetch dropdown options
  const fetchDropdownOptions = useCallback(async (fields: any[]) => {
    if (!fields) return;

    for (const field of fields) {
      if ((field.type === "select" || field.type === "multi-select") && field.fetchOptionsUrl) {
        setLoadingOptions((prev) => ({ ...prev, [field.value]: true }));
        try {
          const response: any = await dynamicRequest(field.fetchOptionsUrl, "GET");
          let options = response?.content || response?.data || response || [];
          if (!Array.isArray(options)) options = [];

          const transformed = options.map((opt: any) => {
            let label = opt[field.optionLabelKey] || opt.displayName || opt.name || opt.code || String(opt.id);
            if (field.optionLabelKey2 && opt[field.optionLabelKey2]) {
              label = `${label} - ${opt[field.optionLabelKey2]}`;
            }
            return { value: opt[field.optionValueKey] || opt.id, label, original: opt };
          });

          setDropdownOptions((prev) => ({ ...prev, [field.value]: transformed }));
        } catch (error) {
          console.error(`Failed to fetch options for ${field.value}:`, error);
        } finally {
          setLoadingOptions((prev) => ({ ...prev, [field.value]: false }));
        }
      }
    }
  }, []);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    if (!config?.getDataUrl) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("pageNo", String(pagination.currentPage));
      params.append("pageSize", String(pagination.pageSize));

      Object.entries(searchData).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value);
      });

      const url = `${config.getDataUrl}?${params.toString()}`;
      const response: any = await dynamicRequest(url, "GET");

      let items: any[] = [];
      let paginationInfo = { ...pagination };

      if (response?.content && Array.isArray(response.content)) {
        items = response.content;
        paginationInfo = {
          currentPage: response.pageNumber ?? response.number ?? 0,
          pageSize: response.pageSize ?? response.size ?? 10,
          totalPages: response.totalPages ?? 1,
          totalElements: response.totalElements ?? items.length,
        };
      } else if (response?.data?.content) {
        items = response.data.content;
        paginationInfo = {
          currentPage: response.data.pageNumber ?? 0,
          pageSize: response.data.pageSize ?? 10,
          totalPages: response.data.totalPages ?? 1,
          totalElements: response.data.totalElements ?? items.length,
        };
      } else if (Array.isArray(response?.data)) {
        items = response.data;
      } else if (Array.isArray(response)) {
        items = response;
      }

      setData(items);
      setPagination(paginationInfo);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [config, pagination.currentPage, pagination.pageSize, searchData]);

  useEffect(() => {
    if (config?.getDataUrl) {
      fetchData();
    }
  }, [config?.getDataUrl, pagination.currentPage, pagination.pageSize]);

  useEffect(() => {
    if (config?.search?.fields) {
      fetchDropdownOptions(config.search.fields);
    }
  }, [config?.search?.fields, fetchDropdownOptions]);

  // Replace URL placeholders
  const replaceUrlPlaceholders = (url: string, rowData: any, entityName?: string) => {
    return url
      .replace("{id}", String(rowData?.id || ""))
      .replace("{entityId}", String(rowData?.id || ""))
      .replace("{entityName}", entityName || config?.auditButton?.entityName || "");
  };

  // Initialize form from row data
  const initializeFormFromRow = (popupFields: any[], rowData: any) => {
    const initialData: Record<string, any> = { id: rowData.id };

    popupFields.forEach((field: any) => {
      const fieldKey = field.value;
      const value = rowData[fieldKey];

      if (value !== undefined && value !== null) {
        initialData[fieldKey] = value;
      }
    });

    return initialData;
  };

  // Handle search
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
    fetchData();
  };

  const handleClearSearch = () => {
    setSearchData({});
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  };

  // Handle button click (Add New)
  const handleButtonClick = (button: any) => {
    if (button.type === "SHOW_POPUP" && button.popupFields) {
      const initialData: Record<string, any> = {};
      button.popupFields.forEach((field: any) => {
        if (field.type === "repeater") {
          initialData[field.value] = [];
        }
      });
      setFormData(initialData);
      setCurrentAction(button);
      setSelectedItem(null);
      fetchDropdownOptions(button.popupFields);
      setFormDialogOpen(true);
    }
  };

  // Handle row action
  const handleRowAction = async (action: any, rowData: any) => {
    console.log("[handleRowAction]", action.type, action.title);

    // VIEW with fetch details
    if (action.type === "SHOW_POPUP" && action.viewFetchDetails) {
      try {
        const url = replaceUrlPlaceholders(action.viewFetchDetails, rowData);

        // Check if this is an audit trail request
        if (url.includes("audit-logs")) {
          setAuditLoading(true);
          setAuditDialogOpen(true);

          const response: any = await dynamicRequest(url, "GET");
          const auditItems = response?.content || response?.data || response || [];

          setAuditData(Array.isArray(auditItems) ? auditItems : []);
          setAuditPagination({
            currentPage: response?.pageNumber ?? 0,
            totalPages: response?.totalPages ?? 1,
            totalElements: response?.totalElements ?? auditItems.length,
            fetchUrl: action.viewFetchDetails,
            entityName: config?.auditButton?.entityName || "",
            entityId: String(rowData.id),
          });
          setAuditLoading(false);
        } else {
          const response: any = await dynamicRequest(url, "GET");
          setViewData(response?.data || response);
          setViewDialogOpen(true);
        }
      } catch (error) {
        console.error("Failed to fetch details:", error);
        toast.error("Failed to load details");
      }
      return;
    }

    // EDIT with popup
    if (action.type === "SHOW_POPUP" && action.popupFields) {
      try {
        let fullRowData = rowData;

        // Fetch full details if we need more data
        if (config?.getDataUrl) {
          try {
            const response: any = await dynamicRequest(`${config.getDataUrl}/${rowData.id}`, "GET");
            fullRowData = response?.data || response || rowData;
          } catch {
            // Use existing rowData if fetch fails
          }
        }

        const initialData = initializeFormFromRow(action.popupFields, fullRowData);
        setFormData(initialData);
        setCurrentAction({ ...action, rowData: fullRowData });
        setSelectedItem(fullRowData);
        fetchDropdownOptions(action.popupFields);
        setFormDialogOpen(true);
      } catch (error) {
        console.error("Failed to prepare edit:", error);
        toast.error("Failed to load details for editing");
      }
      return;
    }

    // STATUS_TOGGLE
    if (action.type === "STATUS_TOGGLE") {
      const statusField = action.statusField || "isActive";
      const currentStatus = rowData[statusField];
      const newStatus = !currentStatus;

      setConfirmDialogData({
        action,
        rowData,
        statusField,
        currentStatus,
        newStatus,
        message: `Are you sure you want to ${newStatus ? "activate" : "deactivate"} this item?`,
      });
      setConfirmDialogOpen(true);
      return;
    }

    // DELETE
    if (action.type === "SHOW_POPUP" && action.method === "DELETE") {
      const initialData = initializeFormFromRow(action.popupFields || [], rowData);
      setFormData(initialData);
      setSelectedItem(rowData);
      setCurrentAction(action);
      setDeleteDialogOpen(true);
      return;
    }
  };

  // Handle status toggle
  const handleConfirmStatusToggle = async () => {
    if (!confirmDialogData) return;

    const { action, rowData, newStatus } = confirmDialogData;
    setIsSubmitting(true);

    try {
      const url = replaceUrlPlaceholders(action.popupSubmitUrl || action.actionUrl, rowData);
      await dynamicRequest(url, action.method || "PATCH", { isActive: newStatus });
      toast.success("Status updated successfully");
      setConfirmDialogOpen(false);
      setConfirmDialogData(null);
      fetchData();
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!selectedItem || !currentAction) return;

    setIsSubmitting(true);
    try {
      const url = replaceUrlPlaceholders(currentAction.popupSubmitUrl, selectedItem);
      await dynamicRequest(url, "DELETE");
      toast.success("Deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      setCurrentAction(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!currentAction) return;

    setIsSubmitting(true);
    try {
      const url = selectedItem?.id
        ? replaceUrlPlaceholders(currentAction.popupSubmitUrl, selectedItem)
        : currentAction.popupSubmitUrl;

      const method = currentAction.method || "POST";

      // Build payload - remove id for create
      const payload = { ...formData };
      if (!selectedItem?.id) {
        delete payload.id;
      }

      console.log("[handleSubmit] Payload:", JSON.stringify(payload, null, 2));

      await dynamicRequest(url, method, payload);
      toast.success(selectedItem?.id ? "Updated successfully" : "Created successfully");
      setFormDialogOpen(false);
      setCurrentAction(null);
      setSelectedItem(null);
      fetchData();
    } catch (error: any) {
      console.error("Failed to submit:", error);
      toast.error(error?.message || "Failed to save");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle audit button click
  const handleAuditButtonClick = async () => {
    if (!config?.auditButton) return;

    setAuditLoading(true);
    setAuditDialogOpen(true);

    try {
      const url = `${config.auditButton.auditFetchUrl}?entityName=${config.auditButton.entityName}&pageNo=0&pageSize=10`;
      const response: any = await dynamicRequest(url, "GET");
      const auditItems = response?.content || response?.data || response || [];

      setAuditData(Array.isArray(auditItems) ? auditItems : []);
      setAuditPagination({
        currentPage: response?.pageNumber ?? 0,
        totalPages: response?.totalPages ?? 1,
        totalElements: response?.totalElements ?? auditItems.length,
        fetchUrl: config.auditButton.auditFetchUrl,
        entityName: config.auditButton.entityName,
        entityId: "",
      });
    } catch (error) {
      console.error("Failed to fetch audit trail:", error);
      toast.error("Failed to load audit trail");
    } finally {
      setAuditLoading(false);
    }
  };

  // Handle audit page change
  const handleAuditPageChange = async (page: number) => {
    setAuditLoading(true);
    try {
      let url = `${auditPagination.fetchUrl}?entityName=${auditPagination.entityName}&pageNo=${page}&pageSize=10`;
      if (auditPagination.entityId) {
        url += `&entityId=${auditPagination.entityId}`;
      }

      const response: any = await dynamicRequest(url, "GET");
      const auditItems = response?.content || response?.data || response || [];

      setAuditData(Array.isArray(auditItems) ? auditItems : []);
      setAuditPagination((prev) => ({
        ...prev,
        currentPage: response?.pageNumber ?? page,
        totalPages: response?.totalPages ?? 1,
        totalElements: response?.totalElements ?? auditItems.length,
      }));
    } catch (error) {
      console.error("Failed to fetch audit page:", error);
    } finally {
      setAuditLoading(false);
    }
  };

  // Loading state
  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading configuration...</span>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-destructive mb-4">Failed to load configuration</p>
        <Button onClick={() => fetchLayoutData(DEFAULT_CONFIG_URL)}>Retry</Button>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-4">No configuration loaded</p>
        <Button onClick={() => fetchLayoutData(DEFAULT_CONFIG_URL)}>Load Configuration</Button>
      </div>
    );
  }

  // Get headers and actions
  const sortedHeaders = [...(config.tableHeaders || [])]
    .filter((h: any) => h.type !== "actions")
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const actionsHeader = config.tableHeaders?.find((h: any) => h.type === "actions");
  const addButton = config.buttons?.find((btn: any) => btn.type === "SHOW_POPUP");
  const searchFields = config.search?.fields || [];

  const hasSearchCriteria = Object.values(searchData).some(
    (val) => val && val !== "" && val !== "all"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {config.pageTitle || "Carousels"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {config.pageDescription || "Manage carousel banners"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {config.auditButton && (
            <Button variant="outline" onClick={handleAuditButtonClick}>
              <DynamicIcon name={config.auditButton.icon || "History"} className="mr-2 h-4 w-4" />
              {config.auditButton.label || "Audit Log"}
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {addButton && (
            <Button onClick={() => handleButtonClick(addButton)}>
              <Plus className="mr-2 h-4 w-4" />
              {addButton.title || "Add New"}
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      {config.searchable && searchFields.length > 0 && (
        <Card>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              {searchFields.map((field: any, idx: number) => {
                if (field.type === "text" || field.type === "number") {
                  return (
                    <div key={idx} className="flex-1 min-w-[150px] max-w-[200px]">
                      <Label className="text-xs mb-1 block">{field.label}</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type={field.type}
                          placeholder={field.placeholder}
                          value={searchData[field.value] || ""}
                          onChange={(e) => setSearchData((prev) => ({ ...prev, [field.value]: e.target.value }))}
                          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                          className="pl-9"
                        />
                      </div>
                    </div>
                  );
                }
                if (field.type === "select") {
                  const rawOptions = dropdownOptions[field.value] || field.selectOptions || [];
                  const options = rawOptions.filter((opt: any) =>
                    opt.value !== "" && opt.value !== null && opt.value !== undefined
                  );
                  return (
                    <div key={idx} className="min-w-[150px]">
                      <Label className="text-xs mb-1 block">{field.label}</Label>
                      <Select
                        value={searchData[field.value] || "all"}
                        onValueChange={(value) =>
                          setSearchData((prev) => ({ ...prev, [field.value]: value === "all" ? "" : value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={field.placeholder} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          {options.map((opt: any, optIdx: number) => (
                            <SelectItem key={optIdx} value={String(opt.value)}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                return null;
              })}
              <Button onClick={handleSearch} disabled={loading}>
                {config.search?.searchBtnText || "Search"}
              </Button>
              {hasSearchCriteria && (
                <Button variant="ghost" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {sortedHeaders.map((header: any) => (
                  <TableHead key={header.accessor}>{header.Header}</TableHead>
                ))}
                {actionsHeader && <TableHead className="w-20">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    {sortedHeaders.map((header: any) => (
                      <TableCell key={header.accessor}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                    {actionsHeader && (
                      <TableCell>
                        <Skeleton className="h-6 w-8" />
                      </TableCell>
                    )}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={sortedHeaders.length + (actionsHeader ? 1 : 0)}
                    className="h-32 text-center text-muted-foreground"
                  >
                    No data found
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, rowIdx) => (
                  <TableRow key={item.id || rowIdx} className="hover:bg-muted/50">
                    {sortedHeaders.map((header: any) => (
                      <TableCell key={header.accessor}>
                        <CellRenderer header={header} value={item[header.accessor]} rowData={item} />
                      </TableCell>
                    ))}
                    {actionsHeader?.actions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actionsHeader.actions.map((action: any, actionIdx: number) => {
                              let displayTitle = action.title;
                              let buttonClassName = "";

                              // Handle STATUS_TOGGLE display
                              if (action.type === "STATUS_TOGGLE") {
                                const statusField = action.statusField || "isActive";
                                const currentStatus = item[statusField];
                                displayTitle = currentStatus
                                  ? action.inactiveLabel || "Deactivate"
                                  : action.activeLabel || "Activate";
                                buttonClassName = currentStatus
                                  ? "text-red-500 hover:text-red-700"
                                  : "text-green-600 hover:text-green-700";
                              }

                              // Handle Delete styling
                              if (action.method === "DELETE") {
                                buttonClassName = "text-destructive";
                              }

                              return (
                                <DropdownMenuItem
                                  key={actionIdx}
                                  className={buttonClassName}
                                  onClick={() => handleRowAction(action, item)}
                                >
                                  {displayTitle}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.totalPages > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">{pagination.totalElements} items</p>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.currentPage + 1} of {pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                      disabled={pagination.currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                      disabled={pagination.currentPage >= pagination.totalPages - 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{currentAction?.popupTitle || (selectedItem ? "Edit" : "Add New")}</DialogTitle>
            <DialogDescription>{currentAction?.popupSubtitle || "Fill in the details"}</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-1 py-4 space-y-4">
            {currentAction?.popupFields?.map((field: any, idx: number) => (
              <FormFieldRenderer
                key={idx}
                field={field}
                formData={formData}
                onFormDataChange={setFormData}
                dropdownOptions={dropdownOptions}
                loadingOptions={loadingOptions}
              />
            ))}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setFormDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedItem ? "Updating..." : "Creating..."}
                </>
              ) : (
                currentAction?.popupSubmitText || (selectedItem ? "Update" : "Create")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Popup */}
      <ViewDetailsPopup open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} data={viewData} />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{currentAction?.popupTitle || "Delete"}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {currentAction?.popupFields && (
            <div className="space-y-3 py-2">
              {currentAction.popupFields.map((field: any, idx: number) => (
                <div key={idx} className="grid gap-1">
                  <Label className="text-sm text-muted-foreground">{field.label}</Label>
                  <p className="text-sm font-medium">{formData[field.value] || "-"}</p>
                </div>
              ))}
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                currentAction?.popupSubmitText || "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Confirmation */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>{confirmDialogData?.message}</DialogDescription>
          </DialogHeader>

          {confirmDialogData && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-muted-foreground">ID:</span>
                  <span className="text-sm font-semibold">{confirmDialogData.rowData.id}</span>
                </div>
                <div className="flex justify-between items-start pt-2 border-t">
                  <span className="text-sm font-medium text-muted-foreground">New Status:</span>
                  <Badge variant={confirmDialogData.newStatus ? "default" : "secondary"}>
                    {confirmDialogData.newStatus ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleConfirmStatusToggle} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Audit Trail Popup */}
      <AuditTrailPopup
        open={auditDialogOpen}
        onClose={() => setAuditDialogOpen(false)}
        data={auditData}
        title="Audit Trail"
        pagination={auditPagination}
        onPageChange={handleAuditPageChange}
        isLoading={auditLoading}
      />
    </div>
  );
}
