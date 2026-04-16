"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react@0.487.0";
import { DayPicker } from "react-day-picker@8.10.1";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3 bg-white border border-gray-200 shadow-sm", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full mb-1",
        caption_label: "text-sm font-semibold text-gray-900",
        nav: "flex items-center gap-1",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "size-7 bg-white hover:bg-gray-50 border-gray-300 p-0 opacity-70 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-gray-600 font-semibold rounded-md w-9 font-normal text-[0.75rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "size-9 p-0 font-normal text-gray-700 hover:bg-gray-100 hover:text-gray-900 aria-selected:opacity-100",
        ),
        day_range_start:
          "day-range-start aria-selected:bg-blue-600 aria-selected:text-white",
        day_range_end:
          "day-range-end aria-selected:bg-blue-600 aria-selected:text-white",
        day_selected:
          "bg-blue-600 text-white hover:bg-blue-700 hover:text-white focus:bg-blue-700 focus:text-white font-semibold",
        day_today: "bg-blue-50 text-blue-700 font-semibold border-2 border-blue-300",
        day_outside:
          "day-outside text-gray-400 opacity-50 aria-selected:text-gray-500",
        day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-blue-50 aria-selected:text-blue-700",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4 text-gray-700", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4 text-gray-700", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };
