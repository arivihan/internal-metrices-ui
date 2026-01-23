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
} from "lucide-react";
import { DynamicIcon } from "@/lib/icon-map";
import { apiClient, dynamicRequest } from "@/services/apiClient";
import { toast } from "sonner";
import { useSignals } from "@preact/signals-react/runtime";
import {
  layoutData,
  layoutLoading,
  layoutError,
  fetchLayoutData,
} from "@/signals/dynamicContent";

// Default config URL for carousels (used if accessed directly without sidebar click)
const DEFAULT_CONFIG_URL = "/secure/api/v1/dashboard-ui-config/get-by-route?route=/app-carousels";

// Types
interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
}

// Cell Renderer Component
const CellRenderer = ({
  header,
  value,
  rowData,
}: {
  header: any;
  value: any;
  rowData: any;
}) => {
  if (value === undefined || value === null) return "-";

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
  if (header.type === "boolean") {
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

  // Date type
  if (header.type === "date") {
    try {
      const date = new Date(value);
      return (
        <span className="text-sm text-muted-foreground">
          {date.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
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

// Key-Value Pairs Editor Component
const KeyValuePairsEditor = ({
  value,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  addButtonText = "Add Parameter",
}: {
  value: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addButtonText?: string;
}) => {
  const pairs = Object.entries(value || {});

  const handleKeyChange = (oldKey: string, newKey: string, idx: number) => {
    const entries = Object.entries(value || {});
    const newEntries = entries.map(([k, v], i) =>
      i === idx ? [newKey, v] : [k, v]
    );
    onChange(Object.fromEntries(newEntries));
  };

  const handleValueChange = (key: string, newValue: string) => {
    onChange({ ...value, [key]: newValue });
  };

  const handleRemove = (key: string) => {
    const newValue = { ...value };
    delete newValue[key];
    onChange(newValue);
  };

  const handleAdd = () => {
    const newKey = `key${Object.keys(value || {}).length + 1}`;
    onChange({ ...value, [newKey]: "" });
  };

  return (
    <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
      {pairs.map(([key, val], idx) => (
        <div key={idx} className="flex items-center gap-2">
          <Input
            placeholder={keyPlaceholder}
            value={key}
            onChange={(e) => handleKeyChange(key, e.target.value, idx)}
            className="flex-1"
          />
          <Input
            placeholder={valuePlaceholder}
            value={val as string}
            onChange={(e) => handleValueChange(key, e.target.value)}
            className="flex-1"
          />
          <button
            type="button"
            onClick={() => handleRemove(key)}
            className="p-2 text-destructive hover:bg-destructive/10 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAdd}
        className="w-full mt-2"
      >
        <Plus className="mr-2 h-4 w-4" />
        {addButtonText}
      </Button>
    </div>
  );
};

// Dynamic Form Field Renderer
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

  // Section divider
  if (field.type === "section-divider") {
    return (
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold text-muted-foreground mb-4">
          {field.label}
        </h4>
      </div>
    );
  }

  // Select field
  if (field.type === "select") {
    const rawOptions = dropdownOptions[fieldKey] || field.selectOptions || [];
    // Filter out options with empty/null/undefined values
    const options = rawOptions.filter((opt: any) =>
      opt.value !== "" && opt.value !== null && opt.value !== undefined
    );
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldKey}>
          {field.label} {field.required && "*"}
        </Label>
        <Select
          value={String(value ?? field.defaultValue ?? "")}
          onValueChange={(val) => {
            // Convert "true"/"false" strings to booleans for boolean fields
            let newValue: any = val;
            if (val === "true") newValue = true;
            else if (val === "false") newValue = false;
            onFormDataChange({ ...formData, [fieldKey]: newValue });
          }}
          disabled={loadingOptions[fieldKey]}
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
        {field.helpText && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  // Multi-select field
  if (field.type === "multi-select") {
    const options = dropdownOptions[fieldKey] || [];
    const selectedValues = Array.isArray(value) ? value : [];
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldKey}>
          {field.label} {field.required && "*"}
        </Label>
        <div className="border rounded-md p-2 space-y-2 max-h-48 overflow-y-auto">
          {loadingOptions[fieldKey] ? (
            <div className="p-2 text-center text-sm text-muted-foreground">
              <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
              Loading...
            </div>
          ) : options.length > 0 ? (
            options.map((opt: any, idx: number) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(opt.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, opt.value]
                      : selectedValues.filter((v: any) => v !== opt.value);
                    onFormDataChange({ ...formData, [fieldKey]: newValues });
                  }}
                  className="rounded"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))
          ) : (
            <div className="p-2 text-center text-sm text-muted-foreground">
              No options available
            </div>
          )}
        </div>
      </div>
    );
  }

  // Key-value pairs field
  if (field.type === "key-value-pairs") {
    return (
      <div className="grid gap-2">
        <Label>{field.label}</Label>
        <KeyValuePairsEditor
          value={value || {}}
          onChange={(val) => onFormDataChange({ ...formData, [fieldKey]: val })}
          keyPlaceholder={field.keyPlaceholder}
          valuePlaceholder={field.valuePlaceholder}
          addButtonText={field.addButtonText}
        />
        {field.helpText && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  // JSON editor field
  if (field.type === "json-editor") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldKey}>{field.label}</Label>
        <textarea
          id={fieldKey}
          placeholder={field.placeholder || '{"key": "value"}'}
          value={
            typeof value === "object"
              ? JSON.stringify(value, null, 2)
              : value || ""
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
        {field.helpText && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
      </div>
    );
  }

  // Image upload field (shows preview)
  if (field.type === "image-upload") {
    return (
      <div className="grid gap-2">
        <Label htmlFor={fieldKey}>
          {field.label} {field.required && "*"}
        </Label>
        <Input
          id={fieldKey}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onFormDataChange({ ...formData, [fieldKey]: e.target.value })}
        />
        {value && (
          <div className="mt-2 p-2 border rounded">
            <img
              src={value}
              alt="Preview"
              className="max-h-32 object-contain mx-auto"
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/200x80?text=Invalid+URL";
              }}
            />
          </div>
        )}
        {field.helpText && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
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
          value={value ?? field.defaultValue ?? ""}
          onChange={(e) => onFormDataChange({ ...formData, [fieldKey]: Number(e.target.value) })}
          min={field.min}
          max={field.max}
        />
        {field.helpText && (
          <p className="text-xs text-muted-foreground">{field.helpText}</p>
        )}
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
        type={field.type || "text"}
        placeholder={field.placeholder}
        value={value || ""}
        onChange={(e) => onFormDataChange({ ...formData, [fieldKey]: e.target.value })}
      />
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
};

// Main Component
export default function HomePageDynamic() {
  useSignals();

  // Get config from signals (fetched from DynamoDB)
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
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAction, setCurrentAction] = useState<any | null>(null);
  const [confirmDialogData, setConfirmDialogData] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>({});
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({});

  // Fetch config on mount if not already loaded
  useEffect(() => {
    if (!config && !configLoading) {
      console.log("[HomePageDynamic] No config loaded, fetching from default URL");
      fetchLayoutData(DEFAULT_CONFIG_URL);
    }
  }, [config, configLoading]);

  // Update pagination pageSize from config
  useEffect(() => {
    if (config?.pagination?.defaultPageSize) {
      setPagination(prev => ({
        ...prev,
        pageSize: config.pagination.defaultPageSize
      }));
    }
  }, [config?.pagination?.defaultPageSize]);

  // Fetch dropdown options for fields with fetchOptionsUrl
  const fetchDropdownOptions = useCallback(async (fields: any[]) => {
    if (!fields) return;

    for (const field of fields) {
      if ((field.type === "select" || field.type === "multi-select") && field.fetchOptionsUrl) {
        setLoadingOptions((prev) => ({ ...prev, [field.value]: true }));
        try {
          const response: any = await dynamicRequest(field.fetchOptionsUrl, "GET");
          let options = [];

          if (response?.content && Array.isArray(response.content)) {
            options = response.content;
          } else if (response?.data && Array.isArray(response.data)) {
            options = response.data;
          } else if (Array.isArray(response)) {
            options = response;
          }

          const transformed = options.map((opt: any) => {
            let label = opt[field.optionLabelKey] || opt.displayName || opt.name || opt.code || String(opt.id);
            if (field.optionLabelKey2 && opt[field.optionLabelKey2]) {
              label = `${label} - ${opt[field.optionLabelKey2]}`;
            }
            return {
              value: opt[field.optionValueKey] || opt.id,
              label,
              original: opt,
            };
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
      console.log("[HomePageDynamic] No getDataUrl in config, skipping fetch");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      const paginationConfig = config.pagination || {};
      params.append(paginationConfig.pageNoParam || "pageNo", String(pagination.currentPage));
      params.append(paginationConfig.pageSizeParam || "pageSize", String(pagination.pageSize));

      // Add search filters
      Object.entries(searchData).forEach(([key, value]) => {
        if (value && value !== "all") params.append(key, value);
      });

      const url = `${config.getDataUrl}?${params.toString()}`;
      const response: any = await dynamicRequest(url, "GET");

      // Handle response format
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
      } else if (response?.data?.content && Array.isArray(response.data.content)) {
        items = response.data.content;
        paginationInfo = {
          currentPage: response.data.pageNumber ?? 0,
          pageSize: response.data.pageSize ?? 10,
          totalPages: response.data.totalPages ?? 1,
          totalElements: response.data.totalElements ?? items.length,
        };
      } else if (response?.data && Array.isArray(response.data)) {
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

  // Fetch search filter options on mount
  useEffect(() => {
    if (config?.search?.fields) {
      fetchDropdownOptions(config.search.fields);
    }
  }, [config?.search?.fields, fetchDropdownOptions]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  // Handle search
  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
    fetchData();
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchData({});
    setPagination((prev) => ({ ...prev, currentPage: 0 }));
  };

  // Replace URL placeholders with actual values
  const replaceUrlPlaceholders = (url: string, rowData: any) => {
    return url
      .replace("{id}", String(rowData.id || ""))
      .replace("{entityId}", String(rowData.id || ""));
  };

  // Initialize form data from row (for edit)
  const initializeFormFromRow = (popupFields: any[], rowData: any) => {
    const initialData: Record<string, any> = { id: rowData.id };

    popupFields.forEach((field: any) => {
      if (field.type === "section-divider") return;

      const fieldKey = field.value;
      const apiFieldKey = field.apiField || field.value;

      // Handle nested paths like "batches[0].batchId"
      if (apiFieldKey.includes("[") && apiFieldKey.includes("]")) {
        const match = apiFieldKey.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
        if (match) {
          const [, arrayName, index, prop] = match;
          const arr = rowData[arrayName];
          if (arr && arr[parseInt(index)]) {
            initialData[fieldKey] = arr[parseInt(index)][prop];
          }
        }
      } else {
        const value = rowData[apiFieldKey];
        if (value !== undefined && value !== null) {
          initialData[fieldKey] = value;
        } else if (field.defaultValue !== undefined) {
          initialData[fieldKey] = field.defaultValue;
        }
      }
    });

    return initialData;
  };

  // Handle button click (top action buttons)
  const handleButtonClick = (button: any) => {
    if (button.type === "SHOW_POPUP" && button.popupFields) {
      // Initialize form with default values
      const initialData: Record<string, any> = {};
      button.popupFields.forEach((field: any) => {
        if (field.type !== "section-divider" && field.defaultValue !== undefined) {
          initialData[field.value] = field.defaultValue;
        }
      });
      setFormData(initialData);
      setCurrentAction(button);
      setSelectedItem(null);
      fetchDropdownOptions(button.popupFields);
      setFormDialogOpen(true);
    }
  };

  // Handle row action (dropdown menu actions)
  const handleRowAction = async (action: any, rowData: any) => {
    console.log("[handleRowAction] Action:", action.type, action.title);
    console.log("[handleRowAction] Row data:", rowData);

    // ACTION_VIEW - View details
    if (action.type === "ACTION_VIEW") {
      try {
        if (action.actionUrl) {
          const url = replaceUrlPlaceholders(action.actionUrl, rowData);
          const response: any = await dynamicRequest(url, "GET");
          setSelectedItem(response?.data || response);
        } else {
          setSelectedItem(rowData);
        }
        setViewDialogOpen(true);
      } catch (error) {
        console.error("Failed to fetch details:", error);
        toast.error("Failed to load details");
      }
      return;
    }

    // SHOW_POPUP - Edit or other popup
    if (action.type === "SHOW_POPUP" && action.popupFields) {
      try {
        let fullRowData = rowData;
        // Fetch full details if actionUrl is provided
        if (action.actionUrl) {
          const url = replaceUrlPlaceholders(action.actionUrl, rowData);
          const response: any = await dynamicRequest(url, "GET");
          fullRowData = response?.data || response;
        }

        const initialData = initializeFormFromRow(action.popupFields, fullRowData);
        setFormData(initialData);
        setCurrentAction({ ...action, rowData: fullRowData });
        setSelectedItem(fullRowData);
        fetchDropdownOptions(action.popupFields);
        setFormDialogOpen(true);
      } catch (error) {
        console.error("Failed to fetch details:", error);
        toast.error("Failed to load details for editing");
      }
      return;
    }

    // ACTION_TOGGLE_STATUS - Toggle status with confirmation
    if (action.type === "ACTION_TOGGLE_STATUS") {
      const statusField = action.statusField || "isActive";
      const currentStatus = rowData[statusField];
      const newStatus = !currentStatus;

      setConfirmDialogData({
        action,
        rowData,
        statusField,
        currentStatus,
        newStatus,
        message: action.confirmationMessage || `Are you sure you want to change the status?`,
      });
      setConfirmDialogOpen(true);
      return;
    }

    // ACTION_DELETE - Delete with confirmation
    if (action.type === "ACTION_DELETE") {
      setSelectedItem(rowData);
      setCurrentAction(action);
      setDeleteDialogOpen(true);
      return;
    }
  };

  // Handle status toggle confirmation
  const handleConfirmStatusToggle = async () => {
    if (!confirmDialogData) return;

    const { action, rowData, newStatus } = confirmDialogData;
    setIsSubmitting(true);

    try {
      const url = replaceUrlPlaceholders(action.actionUrl, rowData);
      const method = action.method || "PATCH";

      await dynamicRequest(url, method, { isActive: newStatus });
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

  // Handle delete confirmation
  const handleDelete = async () => {
    if (!selectedItem || !currentAction) return;

    setIsSubmitting(true);
    try {
      const url = replaceUrlPlaceholders(currentAction.actionUrl, selectedItem);
      const method = currentAction.method || "DELETE";

      await dynamicRequest(url, method);
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

  // Transform form data to API payload
  const transformFormDataToPayload = (formData: Record<string, any>, popupFields: any[]) => {
    const payload: any = {};

    // Include id if present (for edit)
    if (formData.id) {
      payload.id = formData.id;
    }

    // Group fields by their nested structure
    const nestedGroups: Record<string, Record<string, any>[]> = {};

    popupFields.forEach((field: any) => {
      if (field.type === "section-divider") return;

      const fieldKey = field.value;
      const apiField = field.apiField || field.value;
      let value = formData[fieldKey];

      // Skip empty values
      if (value === undefined || value === null || value === "") return;

      // Handle nested array paths like "batches[0].batchId"
      const nestedMatch = apiField.match(/^(\w+)\[(\d+)\]\.(\w+)$/);
      if (nestedMatch) {
        const [, arrayName, index, prop] = nestedMatch;
        const idx = parseInt(index);

        if (!nestedGroups[arrayName]) {
          nestedGroups[arrayName] = [];
        }
        if (!nestedGroups[arrayName][idx]) {
          nestedGroups[arrayName][idx] = {};
        }
        nestedGroups[arrayName][idx][prop] = value;
      } else {
        payload[apiField] = value;
      }
    });

    // Add nested groups to payload
    Object.entries(nestedGroups).forEach(([arrayName, items]) => {
      payload[arrayName] = items.filter(Boolean);
    });

    return payload;
  };

  // Handle form submit
  const handleSubmit = async () => {
    if (!currentAction) return;

    setIsSubmitting(true);
    try {
      const payload = transformFormDataToPayload(formData, currentAction.popupFields || []);
      console.log("[handleSubmit] Payload:", JSON.stringify(payload, null, 2));

      let url = currentAction.popupSubmitUrl || currentAction.actionUrl;
      const method = currentAction.method || "POST";
      const isEdit = !!selectedItem?.id;

      if (isEdit && url) {
        url = replaceUrlPlaceholders(url, selectedItem);
      }

      await dynamicRequest(url, method, payload);
      toast.success(isEdit ? "Updated successfully" : "Created successfully");
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

  // Loading state while fetching config
  if (configLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading configuration...</span>
      </div>
    );
  }

  // Error state
  if (configError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-destructive mb-4">Failed to load configuration</p>
        <p className="text-sm text-muted-foreground mb-4">{configError}</p>
        <Button onClick={() => fetchLayoutData(DEFAULT_CONFIG_URL)}>
          Retry
        </Button>
      </div>
    );
  }

  // No config loaded
  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <p className="text-muted-foreground mb-4">No configuration loaded</p>
        <Button onClick={() => fetchLayoutData(DEFAULT_CONFIG_URL)}>
          Load Configuration
        </Button>
      </div>
    );
  }

  // Sorted headers from config (exclude actions column for now, handled separately)
  const sortedHeaders = [...(config.tableHeaders || [])]
    .filter((h: any) => h.type !== "actions")
    .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  // Get actions column config
  const actionsHeader = config.tableHeaders?.find((h: any) => h.type === "actions");

  // Find add button from config
  const addButton = config.buttons?.find((btn: any) => btn.type === "SHOW_POPUP");

  // Search fields from config
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
            {config.pageTitle || "Dynamic Page"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {config.pageDescription || ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          {addButton && (
            <Button onClick={() => handleButtonClick(addButton)}>
              {addButton.icon && (
                <DynamicIcon name={addButton.icon} className="mr-2 h-4 w-4" />
              )}
              {addButton.title || "Add New"}
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            {searchFields.map((field: any, idx: number) => {
              if (field.type === "text") {
                return (
                  <div key={idx} className={`flex-1 min-w-[150px] ${field.colSpan === 2 ? 'max-w-sm' : 'max-w-[200px]'}`}>
                    <Label className="text-xs mb-1 block">{field.label}</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder={field.placeholder}
                        value={searchData[field.value] || ""}
                        onChange={(e) => setSearchData(prev => ({ ...prev, [field.value]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        className="pl-9"
                      />
                    </div>
                  </div>
                );
              }
              if (field.type === "select") {
                const rawOptions = dropdownOptions[field.value] || field.selectOptions || [];
                // Filter out options with empty/null/undefined values
                const options = rawOptions.filter((opt: any) =>
                  opt.value !== "" && opt.value !== null && opt.value !== undefined
                );
                return (
                  <div key={idx} className="min-w-[150px]">
                    <Label className="text-xs mb-1 block">{field.label}</Label>
                    <Select
                      value={searchData[field.value] || "all"}
                      onValueChange={(value) => setSearchData(prev => ({ ...prev, [field.value]: value === "all" ? "" : value }))}
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
                {config.search?.resetBtnText || "Clear"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {sortedHeaders.map((header: any) => (
                  <TableHead key={header.accessor}>{header.Header}</TableHead>
                ))}
                {actionsHeader && <TableHead className="w-[80px]">Actions</TableHead>}
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
                    {config.emptyState?.title || "No data found"}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, rowIdx) => (
                  <TableRow key={item.id || rowIdx} className="hover:bg-muted/50">
                    {sortedHeaders.map((header: any) => (
                      <TableCell key={header.accessor}>
                        <CellRenderer
                          header={header}
                          value={item[header.accessor]}
                          rowData={item}
                        />
                      </TableCell>
                    ))}
                    {actionsHeader && actionsHeader.actions && (
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actionsHeader.actions.map((action: any, actionIdx: number) => {
                              // Determine display title for status toggle
                              let displayTitle = action.title;
                              let buttonClassName = "";

                              if (action.type === "ACTION_TOGGLE_STATUS") {
                                const statusField = action.statusField || "isActive";
                                const currentStatus = item[statusField];
                                displayTitle = currentStatus ? "Deactivate" : "Activate";
                                buttonClassName = currentStatus
                                  ? "text-red-500 hover:text-red-700"
                                  : "text-green-600 hover:text-green-700";
                              }

                              if (action.type === "ACTION_DELETE") {
                                buttonClassName = "text-destructive";
                              }

                              return (
                                <DropdownMenuItem
                                  key={actionIdx}
                                  className={buttonClassName}
                                  onClick={() => handleRowAction(action, item)}
                                >
                                  {action.icon && (
                                    <DynamicIcon
                                      name={action.icon}
                                      className="mr-2 h-4 w-4"
                                    />
                                  )}
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
              <p className="text-sm text-muted-foreground">
                {pagination.totalElements} items
              </p>
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
                      onClick={() => handlePageChange(Math.max(0, pagination.currentPage - 1))}
                      disabled={pagination.currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
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

      {/* Dynamic Form Dialog (Create/Edit) */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {currentAction?.popupTitle || (selectedItem ? "Edit" : "Add New")}
            </DialogTitle>
            <DialogDescription>
              {currentAction?.popupSubTitle || "Fill in the details below"}
            </DialogDescription>
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
            <Button
              variant="outline"
              onClick={() => setFormDialogOpen(false)}
              disabled={isSubmitting}
            >
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

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Details</DialogTitle>
            <DialogDescription>
              {selectedItem?.carouselCode || selectedItem?.code || `ID: ${selectedItem?.id}`}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            {selectedItem && (
              <div className="space-y-4">
                {/* Image Preview */}
                {selectedItem.url && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <img
                      src={selectedItem.url}
                      alt="Banner"
                      className="max-h-48 object-contain mx-auto rounded"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {Object.entries(selectedItem).map(([key, value]) => {
                    // Skip complex objects and arrays for simple display
                    if (typeof value === "object" && value !== null) return null;
                    return (
                      <div key={key}>
                        <span className="font-medium text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <p>
                          {typeof value === "boolean" ? (
                            <Badge variant={value ? "default" : "secondary"}>
                              {value ? "Active" : "Inactive"}
                            </Badge>
                          ) : (
                            String(value ?? "-")
                          )}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Batches */}
                {selectedItem.batches && selectedItem.batches.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Batch Configuration</h4>
                    {selectedItem.batches.map((batch: any, idx: number) => (
                      <div key={idx} className="bg-muted/30 p-3 rounded-lg space-y-2 text-sm mb-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">Batch ID:</span> {batch.batchId}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Batch Code:</span> {batch.batchCode || "-"}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Display Order:</span> {batch.displayOrder}
                          </div>
                          <div>
                            <span className="text-muted-foreground">Navigation:</span> {batch.navigationType}
                          </div>
                        </div>
                        {Object.keys(batch.activityParams || {}).length > 0 && (
                          <div>
                            <span className="text-muted-foreground">Activity Params:</span>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(batch.activityParams, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete</AlertDialogTitle>
            <AlertDialogDescription>
              {currentAction?.confirmationMessage ||
                "Are you sure you want to permanently delete this item? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
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
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Status Toggle Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              {confirmDialogData?.message}
            </DialogDescription>
          </DialogHeader>

          {confirmDialogData && (
            <div className="space-y-4 py-4">
              <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
                {confirmDialogData.rowData.carouselCode && (
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-muted-foreground">Code:</span>
                    <span className="text-sm font-semibold">{confirmDialogData.rowData.carouselCode}</span>
                  </div>
                )}
                <div className="flex justify-between items-start pt-2 border-t">
                  <span className="text-sm font-medium text-muted-foreground">New Status:</span>
                  <span className={`text-sm font-bold ${confirmDialogData.newStatus ? "text-green-600" : "text-red-600"}`}>
                    {confirmDialogData.newStatus ? "Active" : "Inactive"}
                  </span>
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
    </div>
  );
}
