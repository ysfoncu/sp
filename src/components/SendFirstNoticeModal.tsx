import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "./ui/utils";
import { Calendar as CalendarIcon, Send, Users } from "lucide-react";
import { format } from "date-fns";

interface SendFirstNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentCount: number;
  onSend: (deadline: string, message: string) => void;
}

const DEFAULT_MESSAGE =
  "You can now apply for priority placement for your upcoming clinical placement. Log in to the system and complete your application before the deadline.";

export function SendFirstNoticeModal({
  isOpen,
  onClose,
  studentCount,
  onSend,
}: SendFirstNoticeModalProps) {
  const [deadline, setDeadline] = useState<Date | undefined>(undefined);
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) {
      setDeadline(undefined);
      setMessage(DEFAULT_MESSAGE);
      setErrors({});
    }
  }, [isOpen]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!deadline) errs.deadline = "Select an application deadline";
    else if (deadline <= new Date()) errs.deadline = "Date must be in the future";
    if (!message.trim()) errs.message = "Enter a message";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSend() {
    if (!validate()) return;
    onSend(deadline!.toISOString().split("T")[0], message.trim());
    onClose();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send First Notice</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Student count info */}
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-md border border-blue-200">
            <Users size={16} className="text-blue-600 shrink-0" />
            <span className="text-sm text-blue-700">
              <span className="font-semibold">{studentCount}</span> students will be notified
            </span>
          </div>

          {/* Deadline picker */}
          <div>
            <Label>
              Application deadline <span className="text-red-500">*</span>
            </Label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full mt-1 justify-start text-left font-normal",
                    !deadline && "text-gray-400",
                    errors.deadline && "border-red-400"
                  )}
                >
                  <CalendarIcon size={16} className="mr-2" />
                  {deadline ? format(deadline, "d MMM yyyy") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={(d) => {
                    setDeadline(d);
                    setCalendarOpen(false);
                    setErrors((e) => ({ ...e, deadline: "" }));
                  }}
                  disabled={(d) => d <= new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {errors.deadline && (
              <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>
            )}
          </div>

          {/* Message textarea */}
          <div>
            <Label htmlFor="notice-message">
              Message to students <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="notice-message"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setErrors((err) => ({ ...err, message: "" }));
              }}
              rows={4}
              className={cn("mt-1", errors.message && "border-red-400")}
            />
            {errors.message && (
              <p className="text-xs text-red-500 mt-1">{errors.message}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            onClick={handleSend}
          >
            <Send size={14} />
            Send notice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
