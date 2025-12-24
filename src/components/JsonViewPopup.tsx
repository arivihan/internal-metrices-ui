import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";

interface JsonViewPopupProps {
  open: boolean;
  onClose: () => void;
  data: any;
}

export function JsonViewPopup({ open, onClose, data }: JsonViewPopupProps) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>JSON Viewer</DialogTitle>
          <DialogDescription>Structured JSON data</DialogDescription>
        </DialogHeader>

        <Card className="flex-1 overflow-auto">
          <CardContent className="p-4">
            <pre className="text-xs whitespace-pre-wrap break-words font-mono bg-muted p-4 rounded">
              {JSON.stringify(data, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
