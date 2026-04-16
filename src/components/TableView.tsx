import { Badge } from "./ui/badge";
import { placementTasks } from "../types/placementTask";
import { FileText } from "lucide-react";
import { Study } from "./SettingsView";

interface StudentPlacement {
  id: string;
  title: string;
  year: string;
  semester: string;
  subject: string;
  students: number;
  startDate: string;
  endDate: string;
  status:
    | "draft"
    | "upload"
    | "select"
    | "publish"
    | "completed";
  studyId: string;
  programId: string;
}

interface PlacementTaskState {
  placementId: string;
  studentsImported: boolean;
  students: any[];
  quotasSelected: boolean;
  quotas: any[];
  firstPublished: boolean;
  studentsAssigned: boolean;
  documentsAttached: boolean;
  finalPublished: boolean;
  completedTasks: string[];
}

interface TableViewProps {
  placements: StudentPlacement[];
  placementTaskStates?: PlacementTaskState[];
  studies: Study[];
  onPlacementClick: (placement: StudentPlacement) => void;
}

export function TableView({
  placements,
  placementTaskStates = [],
  studies,
  onPlacementClick,
}: TableViewProps) {
  // Get the current task for a placement
  const getCurrentTask = (placementId: string) => {
    const taskState = placementTaskStates.find(
      (ts) => ts.placementId === placementId,
    );
    if (!taskState) {
      return placementTasks[0]; // Return first task if no state found
    }

    // Find the first non-completed task
    const currentTask = placementTasks.find(
      (task) => !taskState.completedTasks.includes(task.id),
    );
    return (
      currentTask || placementTasks[placementTasks.length - 1]
    ); // Return last task if all completed
  };

  // Check if all tasks are completed for a placement
  const isAllTasksCompleted = (placementId: string) => {
    const taskState = placementTaskStates.find(
      (ts) => ts.placementId === placementId,
    );
    if (!taskState) return false;
    
    // Check if all task IDs are in the completedTasks array
    return placementTasks.every((task) =>
      taskState.completedTasks.includes(task.id)
    );
  };

  // Helper to get study and program names
  const getStudyProgramDisplay = (
    studyId: string,
    programId: string,
  ) => {
    const study = studies.find((s) => s.id === studyId);
    const program = study?.programs.find(
      (p) => p.id === programId,
    );
    if (!study || !program) return "N/A";
    return `${study.name} / ${program.name}`;
  };

  const getTaskStatusColor = (step: string) => {
    // Extract the step number (e.g., "1/6" -> 1)
    const stepNumber = parseInt(step.split("/")[0]);

    switch (stepNumber) {
      case 1:
        return "bg-orange-50 text-orange-600 border-orange-200";
      case 2:
        return "bg-red-50 text-red-600 border-red-200";
      case 3:
        return "bg-blue-50 text-blue-600 border-blue-200";
      case 4:
      case 5:
      case 6:
        return "bg-purple-50 text-purple-600 border-purple-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const formatDateRange = (
    startDate: string,
    endDate: string,
  ) => {
    const start = new Date(startDate).toLocaleDateString(
      "en-US",
      {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      },
    );
    const end = new Date(endDate).toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
    return `${start} ~ ${end}`;
  };

  // Show empty state if no placements
  if (placements.length === 0) {
    return (
      <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No placements found
          </h3>
          <p className="text-sm text-gray-500 text-center">
            Create a placement to see it in the table view
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Study / Program
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Year
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Semester
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Emne
              </th>

              <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                Students
              </th>
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                Start-End Date
              </th>
              <th className="px-5 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {placements.map((placement) => (
              <tr
                key={placement.id}
                onClick={() => onPlacementClick(placement)}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3 text-sm text-gray-600">
                  {getStudyProgramDisplay(
                    placement.studyId,
                    placement.programId,
                  )}
                </td>
                <td className="px-5 py-3 text-sm text-gray-700">
                  {placement.title}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {placement.year}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {placement.semester}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {placement.subject}
                </td>

                <td className="px-5 py-3 text-sm text-gray-600 text-center">
                  {placement.students}
                </td>
                <td className="px-5 py-3 text-sm text-gray-600">
                  {formatDateRange(
                    placement.startDate,
                    placement.endDate,
                  )}
                </td>
                <td className="px-5 py-3 text-center">
                  <div className="flex justify-center">
                    {placement.status === "draft" ? (
                      <Badge
                        variant="outline"
                        className="bg-gray-50 text-gray-600 border-gray-200 text-xs font-medium px-2.5 py-0.5"
                      >
                        Draft
                      </Badge>
                    ) : isAllTasksCompleted(placement.id) ? (
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-600 border-green-200 text-xs font-medium px-2.5 py-0.5"
                      >
                        Completed
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className={`${getTaskStatusColor(getCurrentTask(placement.id).step)} text-xs font-medium px-2.5 py-0.5`}
                      >
                        {getCurrentTask(placement.id).step}{" "}
                        {getCurrentTask(placement.id).title}
                      </Badge>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}