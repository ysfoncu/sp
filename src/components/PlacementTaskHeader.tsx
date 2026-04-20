import { ArrowLeft, Calendar as CalendarIcon, HelpCircle, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./ui/breadcrumb";
import { StudentPlacement } from "../types/studentPlacement";
import { PlacementTask } from "../types/placementTask";

interface PlacementTaskHeaderProps {
  placement: StudentPlacement;
  currentTask: PlacementTask | undefined;
  isAssignmentPublished: boolean;
  onBack: () => void;
  onOpenTasks: () => void;
  onEdit: () => void;
  onHelp: () => void;
}

export function PlacementTaskHeader({
  placement,
  currentTask,
  isAssignmentPublished,
  onBack,
  onOpenTasks,
  onEdit,
  onHelp,
}: PlacementTaskHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-7 py-6">
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg p-2 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={onBack}
                className="cursor-pointer text-gray-600 hover:text-gray-900"
              >
                Student Placements
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-gray-900">
                {placement.title || "New Student Placement"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-3">
          <h1 className="font-bold text-xl text-gray-900">
            {placement.title || "New Student Placement"}
          </h1>

          {placement.status !== "draft" && (
            <div className="flex items-center gap-3.5 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>{placement.year}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                <span>{placement.semester}</span>
              </div>
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>
                  {placement.startDate} - {placement.endDate}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isAssignmentPublished ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300"
            >
              <Pencil className="h-4 w-4" />
              <span className="font-medium">Edit</span>
            </Button>
          ) : (
            currentTask && placement.status !== "draft" && (
              <button
                type="button"
                onClick={onOpenTasks}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
                  currentTask.step === "6/6"
                    ? "bg-green-50 border-green-200 text-green-800 hover:bg-green-100"
                    : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"
                }`}
              >
                <span className="font-bold">{currentTask.step}</span>
                <span className="max-w-[180px] truncate">{currentTask.title}</span>
              </button>
            )
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={onHelp}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="font-medium">Help</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
