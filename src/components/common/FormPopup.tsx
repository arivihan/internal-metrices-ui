import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PopupField } from "@/types/sidebar";
import {
  formPopupData,
  updateFormField,
  resetForm,
  getFormData,
} from "@/signals/formPopup";
import { useSignals } from "@preact/signals-react/runtime";

interface FormPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  submitText: string;
  fields: PopupField[];
  onSubmit: (data: Record<string, any>) => void;
}

export function FormPopup({
  open,
  onOpenChange,
  title,
  submitText,
  fields,
  onSubmit,
}: FormPopupProps) {
  useSignals();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(getFormData());
    resetForm();
    onOpenChange(false);
  };

  const handleChange = (fieldValue: string, value: any) => {
    updateFormField(fieldValue, value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-131.25">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              Fill in the form below and click submit when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {fields.map((field, index) => (
              <div key={index} className="grid gap-2">
                <Label htmlFor={field.value}>{field.label}</Label>
                {field.type === "select" && field.selectOptions ? (
                  <select
                    id={field.value}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formPopupData.value[field.value] || ""}
                    onChange={(e) => handleChange(field.value, e.target.value)}
                  >
                    <option value="">Select {field.label}</option>
                    {field.selectOptions.map((option, optIndex) => (
                      <option key={optIndex} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "date" ? (
                  <Input
                    id={field.value}
                    type="date"
                    value={formPopupData.value[field.value] || ""}
                    onChange={(e) => handleChange(field.value, e.target.value)}
                  />
                ) : (
                  <Input
                    id={field.value}
                    type="text"
                    placeholder={field.placeholder}
                    value={formPopupData.value[field.value] || ""}
                    onChange={(e) => handleChange(field.value, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">{submitText}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
