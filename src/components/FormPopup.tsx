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
import { Loader2 } from "lucide-react";
import type { Button as ButtonType, PopupField } from "@/types/sidebar";

interface FormPopupProps {
  open: boolean;
  onClose: () => void;
  button: ButtonType | null;
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function FormPopup({
  open,
  onClose,
  button,
  formData,
  onFormDataChange,
  onSubmit,
  isSubmitting,
}: FormPopupProps) {
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
