import { useState, type MouseEvent, type ReactNode } from "react";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";

/**
 * Opens a calendar popover to pick a single date. Calls onPick with an ISO
 * (YYYY-MM-DD) string. Past dates (before today) are not selectable.
 *
 * - Pass `value` (ISO string) to pre-select / edit an existing date.
 * - Pass `children` to use a custom clickable trigger (e.g. the displayed date
 *   badge), otherwise a default "Select date" button is shown.
 *
 * Stops click propagation so it can live inside clickable table rows.
 */
export function SelectDatePopover({
  value,
  onPick,
  children,
}: {
  value?: string;
  onPick: (iso: string) => void;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(value) : undefined;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 text-blue-600 border-blue-300 hover:bg-blue-50"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <CalendarIcon size={12} />
            Select date
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={(d: Date) => d < today}
          onSelect={(d: Date | undefined) => {
            if (d) {
              onPick(d.toISOString().split("T")[0]);
              setOpen(false);
            }
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
