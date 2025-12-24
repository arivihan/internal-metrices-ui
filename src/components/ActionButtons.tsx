import { Button } from "@/components/ui/button";
import { DynamicIcon } from "@/lib/icon-map";
import type { Button as ButtonType } from "@/types/sidebar";

interface ActionButtonsProps {
  buttons: ButtonType[] | undefined;
  onButtonClick: (button: ButtonType) => void;
}

export function ActionButtons({ buttons, onButtonClick }: ActionButtonsProps) {
  if (!buttons || buttons.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {buttons.map((button, index) => (
        <Button
          key={index}
          onClick={() => onButtonClick(button)}
          className="gap-2"
          variant={index === 0 ? "default" : "outline"}
        >
          {button.icon && (
            <DynamicIcon name={button.icon} className="h-4 w-4" />
          )}
          {button.title}
        </Button>
      ))}
    </div>
  );
}
