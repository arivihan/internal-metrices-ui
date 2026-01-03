import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, X } from "lucide-react";
import type { Button as ButtonType, PopupField } from "@/types/sidebar";
import { useEffect, useState } from "react";
import { dynamicRequest } from "@/services/apiClient";

interface FormPopupProps {
  open: boolean;
  onClose: () => void;
  button: ButtonType | null;
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  selectedOptions?: Record<string, any[]>;
  onSelectedOptionsChange?: (options: Record<string, any[]>) => void;
}

export function FormPopup({
  open,
  onClose,
  button,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
  selectedOptions = {},
  onSelectedOptionsChange,
}: FormPopupProps) {
  const [dropdownOptions, setDropdownOptions] = useState<Record<string, any[]>>(
    {}
  );
  const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>(
    {}
  );

  // Fetch dropdown options from API
  useEffect(() => {
    if (!open || !button?.popupFields) return;

    const fetchOptions = async () => {
      for (const field of button.popupFields || []) {
        if (
          field.fetchOptionsUrl &&
          (field.type === "select" || field.type === "multi-select")
        ) {
          setLoadingOptions((prev) => ({ ...prev, [field.value]: true }));
          try {
            const response: any = await dynamicRequest(field.fetchOptionsUrl, "GET");
            const options = Array.isArray(response)
              ? response
              : (response?.data as any) || (response?.content as any) || [];

            const transformed = options.map((opt: any) => ({
              label: (field.optionLabelKey2 as any)
                ? `${opt[(field.optionLabelKey as any)]} + ${opt[(field.optionLabelKey2 as any)]}`
                : opt[(field.optionLabelKey as any)],
              value: opt[(field.optionValueKey as any)],
              original: opt,
            }));

            setDropdownOptions((prev) => ({
              ...prev,
              [field.value]: transformed,
            }));
          } catch (error) {
            console.error(`Error fetching options for ${field.label}:`, error);
          } finally {
            setLoadingOptions((prev) => ({ ...prev, [field.value]: false }));
          }
        }
      }
    };

    fetchOptions();
  }, [open, button]);

  if (!button) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl h-[80vh] p-0 flex flex-col">
        <DialogHeader className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogTitle>{button.popupTitle || "Form"}</DialogTitle>
          <DialogDescription>Fill in the details below</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="grid gap-4">
            {button.popupFields?.map((field: PopupField, index: number) => (
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
                      {loadingOptions[field.value] ? (
                        <div className="p-2 text-center text-sm text-muted-foreground">
                          <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                          Loading...
                        </div>
                      ) : (
                        <>
                          {(
                            dropdownOptions[field.value] ||
                            field.selectOptions ||
                            []
                          )?.map((option, idx) => (
                            <SelectItem key={idx} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : field.type === "multi-select" ? (
                  <div className="border rounded-md p-2 min-h-10 bg-background">
                    {/* Selected items display */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      {(selectedOptions[field.value] || []).map((item: any, idx: number) => {
                        const label = (field.optionLabelKey2 as any)
                          ? `${item[(field.optionLabelKey as any)]} + ${
                              item[(field.optionLabelKey2 as any)]
                            }`
                          : item[(field.optionLabelKey as any)];
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded text-sm"
                          >
                            <span>{label}</span>
                            <button
                              onClick={() => {
                                const newSelected = selectedOptions[
                                  field.value
                                ].filter((_: any, i: number) => i !== idx);
                                const newOptions = {
                                  ...selectedOptions,
                                  [field.value]: newSelected,
                                };
                                onSelectedOptionsChange?.(newOptions);
                                // Update formData with selected IDs
                                onFormDataChange({
                                  ...formData,
                                  [field.value]: newSelected.map(
                                    (o: any) => o[(field.optionValueKey as any)]
                                  ),
                                });
                              }}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Dropdown for selection */}
                    <Select
                      onValueChange={(value) => {
                        const selectedItem = dropdownOptions[field.value]?.find(
                          (opt) => opt.value === value
                        )?.original;
                        if (selectedItem) {
                          const currentSelected =
                            selectedOptions[field.value] || [];
                          const newSelected = [
                            ...currentSelected,
                            selectedItem,
                          ];
                          const newOptions = {
                            ...selectedOptions,
                            [field.value]: newSelected,
                          };
                          onSelectedOptionsChange?.(newOptions);
                          // Update formData with selected IDs
                          onFormDataChange({
                            ...formData,
                            [field.value]: newSelected.map(
                              (o: any) => o[(field.optionValueKey as any)]
                            ),
                          });
                        }
                      }}
                    >
                      <SelectTrigger id={field.value}>
                        <SelectValue placeholder={field.placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingOptions[field.value] ? (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
                            Loading...
                          </div>
                        ) : (
                          <>
                            {(dropdownOptions[field.value] || [])?.map(
                              (option, idx) => (
                                <SelectItem key={idx} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              )
                            )}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <Input
                    id={field.value}
                    type={field.type || "text"}
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
              button.popupSubmitText || "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
