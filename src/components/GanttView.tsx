import {
  ChevronDown,
  FileX,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import svgPaths from "../imports/svg-qp09jfayx8";
import { Card } from "./ui/card";
import { useState, useMemo } from "react";
import { Button } from "./ui/button";

interface StudentPlacement {
  id: string;
  title: string;
  year: string;
  semester: string;
  subject: string;
  students: number;
  startDate: string;
  endDate: string;
  status: "draft" | "upload" | "select" | "publish" | "completed";
  studyId: string;
  programId: string;
}

interface GanttViewProps {
  placements: StudentPlacement[];
  onPlacementClick?: (placement: StudentPlacement) => void;
}

function BxsSortAlt() {
  return (
    <div className="relative shrink-0 size-3.5">
      <svg
        className="block size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 14 14"
      >
        <g>
          <path
            d={svgPaths.p31e87a00}
            fill="var(--fill-0, #A4A7AE)"
          />
        </g>
      </svg>
    </div>
  );
}

function TimelineBadge({
  placement,
  startPos,
  width,
  top,
  onPlacementClick,
}: {
  placement: StudentPlacement;
  startPos: number;
  width: number;
  top: number;
  onPlacementClick?: (placement: StudentPlacement) => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return {
          bg: "bg-green-100",
          border: "border-green-300",
          text: "text-green-700",
        };
      case "publish":
        return {
          bg: "bg-blue-100",
          border: "border-blue-300",
          text: "text-blue-700",
        };
      case "select":
        return {
          bg: "bg-red-100",
          border: "border-red-300",
          text: "text-red-700",
        };
      case "upload":
        return {
          bg: "bg-orange-100",
          border: "border-orange-300",
          text: "text-orange-700",
        };
      default:
        return {
          bg: "bg-gray-100",
          border: "border-gray-300",
          text: "text-gray-700",
        };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "publish":
        return "Published";
      case "select":
        return "Selection";
      case "upload":
        return "Upload";
      default:
        return status;
    }
  };

  const colors = getStatusColor(placement.status);

  const handleClick = () => {
    if (onPlacementClick) {
      onPlacementClick(placement);
    }
  };

  return (
    <div
      className={`group absolute h-7 flex items-center justify-between px-2 py-1 rounded-md z-10 cursor-pointer hover:opacity-80 transition-opacity pointer-events-auto ${colors.bg} ${colors.border} border`}
      style={{
        left: `${startPos}px`,
        width: `${width}px`,
        top: `${top}px`,
      }}
      onClick={handleClick}
    >
      <div
        className={`flex flex-col justify-center leading-[0] not-italic text-[10px] text-center truncate ${colors.text}`}
      >
        <p className="block leading-[normal] whitespace-nowrap truncate">
          {placement.startDate} ~{placement.endDate}
        </p>
      </div>
      <div className="flex gap-1 items-center justify-start leading-[0] not-italic text-[#535862] text-[10px] text-nowrap ml-1">
        <div className="font-normal">
          <p className="block leading-[normal] text-nowrap whitespace-pre">
            Students
          </p>
        </div>
        <div className="flex flex-col font-medium justify-center">
          <p className="block leading-[normal] text-nowrap whitespace-pre">
            {placement.students}
          </p>
        </div>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-50 pointer-events-none">
        <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg whitespace-nowrap">
          <div className="space-y-1">
            <div className="font-semibold border-b border-gray-700 pb-1 mb-2">
              {placement.title}
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Period:</span>
              <span>
                {placement.startDate} - {placement.endDate}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Students:</span>
              <span>{placement.students}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Status:</span>
              <span className="capitalize">
                {getStatusLabel(placement.status)}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-400">Semester:</span>
              <span>{placement.semester}</span>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GanttView({
  placements,
  onPlacementClick,
}: GanttViewProps) {
  // Get current date - using actual current date
  const today = new Date(); // Always use the real current date

  // Calculate default date range: 3 months before + current month + 3 months after = 7 months
  const defaultStartMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 3,
    1,
  );
  const defaultEndMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 3,
    1,
  );

  const [startMonth, setStartMonth] = useState(
    defaultStartMonth,
  );
  const [endMonth, setEndMonth] = useState(defaultEndMonth);

  // Generate months array based on selected range
  const months = useMemo(() => {
    const result = [];
    const current = new Date(startMonth);

    while (current <= endMonth) {
      result.push({
        date: new Date(current),
        name: current.toLocaleDateString("en-US", {
          month: "short",
        }),
        fullName: current.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        year: current.getFullYear(),
        monthIndex: current.getMonth(),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return result;
  }, [startMonth, endMonth]);

  // Generate week columns for each month
  const getWeeksInMonth = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const weeks = [];
    const weeksCount = Math.ceil(daysInMonth / 6); // Approximate 6 days per week column

    for (let i = 0; i < weeksCount; i++) {
      const startDay = i * 6 + 1;
      const endDay = Math.min((i + 1) * 6, daysInMonth);
      weeks.push(`${startDay}-${endDay}`);
    }

    return weeks;
  };

  // Show empty state if no placements
  if (placements.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {/* Time Frame Selector */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-lg border border-gray-200">
          <Calendar className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            Time Frame:
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartMonth(
                  new Date(
                    startMonth.getFullYear(),
                    startMonth.getMonth() - 1,
                    1,
                  ),
                );
                setEndMonth(
                  new Date(
                    endMonth.getFullYear(),
                    endMonth.getMonth() - 1,
                    1,
                  ),
                );
              }}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[200px] text-center">
              {startMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}{" "}
              -{" "}
              {endMonth.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setStartMonth(
                  new Date(
                    startMonth.getFullYear(),
                    startMonth.getMonth() + 1,
                    1,
                  ),
                );
                setEndMonth(
                  new Date(
                    endMonth.getFullYear(),
                    endMonth.getMonth() + 1,
                    1,
                  ),
                );
              }}
              className="h-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStartMonth(defaultStartMonth);
              setEndMonth(defaultEndMonth);
            }}
            className="h-8 ml-2"
          >
            Reset to Default
          </Button>
        </div>

        <Card className="p-6 border-gray-200">
          <div className="h-64 flex flex-col items-center justify-center">
            <FileX className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">
              No placements found
            </p>
            <p className="text-gray-400 text-xs mt-1">
              Create a placement to see it in the calendar view
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const columnWidth = 46.4; // 232 / 5 columns per month
  const placementRowHeight = 40; // Reduced row height for better visual balance
  const headerHeight = 62;
  const leftOffset = 241;
  const monthWidth = 232;

  const handleRecordClick = (placement: StudentPlacement) => {
    if (onPlacementClick) {
      onPlacementClick(placement);
    }
  };

  // Calculate position based on current visible months
  const calculatePosition = (
    placement: StudentPlacement,
    index: number,
  ) => {
    const startDate = new Date(placement.startDate);
    const endDate = new Date(placement.endDate);

    // Find month indices relative to the visible range
    const startMonthIndex = months.findIndex(
      (m) =>
        m.year === startDate.getFullYear() &&
        m.monthIndex === startDate.getMonth(),
    );
    const endMonthIndex = months.findIndex(
      (m) =>
        m.year === endDate.getFullYear() &&
        m.monthIndex === endDate.getMonth(),
    );

    // If placement is outside visible range, skip it
    if (startMonthIndex === -1 && endMonthIndex === -1) {
      return null;
    }

    const startDay = startDate.getDate();
    const endDay = endDate.getDate();

    // Calculate column position based on day
    const startColumn = Math.floor((startDay - 1) / 6);
    const endColumn = Math.floor((endDay - 1) / 6);

    const effectiveStartMonth = Math.max(0, startMonthIndex);
    const effectiveEndMonth = Math.min(
      months.length - 1,
      endMonthIndex === -1 ? months.length - 1 : endMonthIndex,
    );

    let startPos =
      leftOffset +
      effectiveStartMonth * monthWidth +
      startColumn * columnWidth;
    let endPos =
      leftOffset +
      effectiveEndMonth * monthWidth +
      endColumn * columnWidth +
      columnWidth;

    // If start is before visible range, start from beginning
    if (startMonthIndex === -1) {
      startPos = leftOffset + 8;
    }

    // If end is after visible range, end at the end
    if (
      endMonthIndex === -1 ||
      endMonthIndex >= months.length
    ) {
      endPos = leftOffset + months.length * monthWidth - 8;
    }

    const minWidth = 80;
    const calculatedWidth = Math.max(
      endPos - startPos,
      minWidth,
    );

    // Center the 28px chip (h-7) vertically in the 40px row
    // The header is 62px (left column header is parallel to month 31px + day 31px headers)
    // Then each placement row is 40px, and we add 6px to center the 28px chip: (40 - 28) / 2 = 6px
    const rowTop =
      headerHeight + index * placementRowHeight + 6;

    return {
      startPos: Math.max(startPos, leftOffset + 8),
      width: Math.min(
        calculatedWidth,
        monthWidth * months.length - 16,
      ),
      top: rowTop,
    };
  };

  const totalWidth = leftOffset + months.length * monthWidth;

  return (
    <div className="flex flex-col gap-4">
      {/* Time Frame Selector - New Design */}
      <div className="bg-white border border-[#e5e7eb] rounded-[8.75px] h-[58px] px-4 py-3.5 flex items-center justify-between">
        {/* Left side - Date navigation */}
        <div className="flex items-center gap-2.5">
          <Calendar className="h-[17.5px] w-[17.5px] text-gray-500" />
          <span className="text-[14px] font-bold text-[#101828] leading-[21px] tracking-[-0.1504px]">
            {startMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}{" "}
            -{" "}
            {endMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() => {
              setStartMonth(
                new Date(
                  startMonth.getFullYear(),
                  startMonth.getMonth() - 1,
                  1,
                ),
              );
              setEndMonth(
                new Date(
                  endMonth.getFullYear(),
                  endMonth.getMonth() - 1,
                  1,
                ),
              );
            }}
            className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[6.75px] h-[28px] w-[33.5px] flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="h-[14px] w-[14px]" />
          </button>
          <button
            onClick={() => {
              setStartMonth(
                new Date(
                  startMonth.getFullYear(),
                  startMonth.getMonth() + 1,
                  1,
                ),
              );
              setEndMonth(
                new Date(
                  endMonth.getFullYear(),
                  endMonth.getMonth() + 1,
                  1,
                ),
              );
            }}
            className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[6.75px] h-[28px] w-[33.5px] flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="h-[14px] w-[14px]" />
          </button>
          <button
            onClick={() => {
              setStartMonth(defaultStartMonth);
              setEndMonth(defaultEndMonth);
            }}
            className="bg-white border border-[rgba(0,0,0,0.1)] rounded-[6.75px] h-[28px] px-[11.5px] flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <span className="text-[12.25px] font-medium text-[#0a0a0a] tracking-[-0.0179px]">
              Reset to Default
            </span>
          </button>
        </div>

        {/* Right side - Month count */}
        <div className="text-[10.5px] font-normal text-[#6a7282] tracking-[0.0923px]">
          Showing {months.length} months
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white border border-[#e5e7eb] rounded-[8.75px] w-full relative overflow-x-auto shadow-sm">
        <div
          className="flex w-full relative mb-5"
          style={{ minWidth: `${totalWidth}px` }}
        >
          {/* Left column with placement titles */}
          <div className="flex flex-col w-[241px] z-10 sticky left-0 bg-white">
            <div className="bg-[#f7f7f7] h-[62px] relative shrink-0 w-full border-[0.5px] border-[#d5d7da]">
              <div className="flex flex-row items-center relative size-full">
                <div className="flex gap-2 h-[62px] items-center justify-start px-5 py-3 relative w-full">
                  <div className="basis-0 flex flex-col font-bold grow justify-center leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#535862] text-[12px]">
                    <p className="block leading-[normal]">
                      Placement title
                    </p>
                  </div>
                  <BxsSortAlt />
                </div>
              </div>
            </div>

            {placements.map((placement) => (
              <div
                key={placement.id}
                className="bg-[#f7f7f7] h-[40px] relative shrink-0 w-full border-[0.5px] border-[#d5d7da] cursor-pointer hover:bg-[#f0f0f0] transition-colors"
                onClick={() => handleRecordClick(placement)}
              >
                <div className="flex flex-row items-center relative size-full">
                  <div className="flex gap-2 h-[40px] items-center justify-start px-5 py-2 relative w-full">
                    <div className="basis-0 font-normal grow leading-[0] min-h-px min-w-px not-italic relative shrink-0 text-[#535862] text-[12px]">
                      <p
                        className="block leading-[normal] truncate"
                        title={placement.title}
                      >
                        {placement.title}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Timeline grid */}
          <div className="flex relative">
            {months.map((month, monthIndex) => {
              const weeks = getWeeksInMonth(
                month.year,
                month.monthIndex,
              );

              return (
                <div
                  key={`${month.year}-${month.monthIndex}`}
                  className="flex flex-col w-[232px]"
                >
                  {/* Month header */}
                  <div className="bg-[#f7f7f7] h-[31px] relative shrink-0 w-full border-[0.5px] border-[#d5d7da]">
                    <div className="flex flex-row items-center justify-center relative size-full">
                      <div className="flex gap-2 h-[31px] items-center justify-center px-5 py-3 relative w-full">
                        <div className="flex flex-col font-bold justify-center leading-[0] not-italic relative shrink-0 text-[#535862] text-[12px] text-nowrap">
                          <p className="block leading-[normal] whitespace-pre">
                            {month.name} {month.year}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Day columns within month */}
                  <div className="flex w-full">
                    {weeks.map((dayRange, weekIndex) => (
                      <div
                        key={`${month.year}-${month.monthIndex}-${weekIndex}`}
                        className="basis-0 flex flex-col grow min-h-px min-w-px"
                      >
                        {/* Day range header */}
                        <div className="bg-[#f7f7f7] h-[31px] relative shrink-0 w-full border-[0.5px] border-[#d5d7da]">
                          <div className="flex flex-row items-center justify-center relative size-full">
                            <div className="flex gap-2 h-[31px] items-center justify-center px-1 py-3 relative w-full">
                              <div className="flex flex-col font-medium justify-center leading-[0] not-italic relative shrink-0 text-[#535862] text-[10px] text-center text-nowrap">
                                <p className="block leading-[normal] whitespace-pre">
                                  {dayRange}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Day cells for each placement */}
                        {placements.map((placement) => (
                          <div
                            key={placement.id}
                            className="h-[40px] relative shrink-0 w-full border-[0.5px] border-[#d5d7da]"
                          >
                            <div className="flex flex-row items-center justify-center relative size-full">
                              <div className="flex gap-2 h-[40px] items-center justify-center px-1 py-2 w-full" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Timeline bars overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {placements.map((placement, index) => {
              const position = calculatePosition(
                placement,
                index,
              );

              if (!position) return null;

              return (
                <TimelineBadge
                  key={placement.id}
                  placement={placement}
                  startPos={position.startPos}
                  width={position.width}
                  top={position.top}
                  onPlacementClick={onPlacementClick}
                />
              );
            })}
          </div>

          {/* Vertical grid lines */}
          {months.slice(1).map((month, index) => (
            <div
              key={`line-${month.year}-${month.monthIndex}`}
              className="absolute h-full w-px bg-[#d5d7da] pointer-events-none"
              style={{
                left: `${leftOffset + (index + 1) * monthWidth}px`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}