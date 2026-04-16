import { useState } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ClipboardList,
  Calendar,
  Users,
  BookOpen,
  Building2,
  Settings,
  X,
  Plus,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { PraksisPlace } from "../types/praksisPlace";
import { DashboardSettings, Study } from "./SettingsView";
import { CoordinatorQuotaRequest } from "../types/coordinatorQuotaRequest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";

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

interface PlacementTaskState {
  placementId: string;
  students: any[];
  quotas: any[];
  studentsImported: boolean;
  firstPublished: boolean;
  documentsAttached: boolean;
  finalPublished: boolean;
  completedTasks: string[];
}

interface DashboardTask {
  id: string;
  placementId: string;
  placementTitle: string;
  step: string;
  title: string;
  description: string;
  timestamp: string;
  priority: "high" | "medium" | "low";
}

interface Activity {
  id: string;
  type:
    | "task_completed"
    | "placement_created"
    | "placement_updated"
    | "placement_status_changed";
  title: string;
  description: string;
  timestamp: string;
  placementTitle?: string;
}

interface DashboardProps {
  placements: StudentPlacement[];
  placementTaskStates?: PlacementTaskState[];
  praksisPlaces?: PraksisPlace[];
  studies?: Study[];
  coordinatorQuotaRequests?: CoordinatorQuotaRequest[];
  onStartOnboarding?: () => void;
  onPlacementClick?: (placement: StudentPlacement) => void;
  onPraksisPlaceClick?: (place: PraksisPlace) => void;
  onViewAllClick?: () => void;
  onViewAllPraksisPlacesClick?: () => void;
  onViewAllQuotaRequestsClick?: () => void;
  onQuotaRequestNavigate?: (request: CoordinatorQuotaRequest) => void;
  dashboardSettings?: DashboardSettings;
}

// Placement tasks definition (copied from placementTask.ts for reference)
const placementTasksDefinition = [
  {
    id: "1",
    step: "1/6",
    title: "Setup Students & Quotas",
    description:
      "Select/request quotas from praksis places, then import students",
    status: "mandatory",
  },
  {
    id: "3",
    step: "2/6",
    title: "First publish",
    description:
      "Students will be able to submit their custom requests",
    status: "optional",
  },
  {
    id: "4",
    step: "3/6",
    title: "Attach praksis places to the students",
    description:
      "Use students tab or praksis places tab to assign praksis places to the students",
    status: "mandatory",
  },
  {
    id: "6",
    step: "5/6",
    title: "Assign supervisors to the students",
    description:
      "Use students tab to assign supervisors to the students",
    status: "optional",
  },
  {
    id: "7",
    step: "6/6",
    title: "Second publish",
    description: "Finalise and publish the placement",
    status: "mandatory",
  },
];

export function Dashboard({
  placements,
  placementTaskStates = [],
  praksisPlaces = [],
  studies = [],
  coordinatorQuotaRequests = [],
  onPlacementClick,
  onPraksisPlaceClick,
  onViewAllClick,
  onViewAllPraksisPlacesClick,
  onViewAllQuotaRequestsClick,
  onQuotaRequestNavigate,
  onStartOnboarding,
  dashboardSettings = {
    praksisPlacesOverview: false,
    placementOverview: true,
    quotaRequests: true,
    tasks: true,
    recentActivities: true,
    placementProgress: true,
    yearlyPlacements: true,
  },
}: DashboardProps) {
  const [tasksPage, setTasksPage] = useState(1);
  const [activitiesPage, setActivitiesPage] = useState(1);
  const itemsPerPage = 5;

  // Placement Overview Settings
  const [placementColumns, setPlacementColumns] = useState({
    title: true,
    year: true,
    semester: true,
    subject: true,
    study: true,
    dateRange: true,
    studentsPlaced: true,
    status: true,
  });
  const [placementItemsToShow, setPlacementItemsToShow] =
    useState("3");

  // Praksis Places Overview Settings
  const [praksisPlaceColumns, setPraksisPlaceColumns] =
    useState({
      name: true,
      address: true,
      city: true,
      departments: true,
      capacity: true,
      currentStudents: true,
    });
  const [praksisPlaceItemsToShow, setPraksisPlaceItemsToShow] =
    useState("3");

  // Quota Requests Settings
  const [quotaRequestsItemsToShow, setQuotaRequestsItemsToShow] =
    useState("3");
  const [quotaRequestsColumns, setQuotaRequestsColumns] = useState({
    place: true,
    study: true,
    requested: true,
    approved: true,
    period: true,
    status: true,
    actions: true,
  });

  // Tasks Settings
  const [tasksToShow, setTasksToShow] = useState(5);
  const [showAllTasksOverlay, setShowAllTasksOverlay] =
    useState(false);

  // Recent Activities Settings
  const [activitiesToShow, setActivitiesToShow] = useState(5);
  const [
    showAllActivitiesOverlay,
    setShowAllActivitiesOverlay,
  ] = useState(false);

  // Placement Progress Settings
  const [progressColumns, setProgressColumns] = useState({
    title: true,
    status: true,
    progress: true,
  });
  const [progressItemsToShow, setProgressItemsToShow] =
    useState("3");

  // Yearly Placements Overview Settings
  const [yearlyColumns, setYearlyColumns] = useState({
    year: true,
    completedPlacements: true,
    students: true,
    change: true,
  });
  const [yearlyItemsToShow, setYearlyItemsToShow] =
    useState("3");

  // Helper function to get task state for a placement
  const getPlacementTaskState = (
    placementId: string,
  ): PlacementTaskState | undefined => {
    return placementTaskStates.find(
      (state) => state.placementId === placementId,
    );
  };

  // Helper function to check if a placement is active
  const isPlacementActive = (
    placement: StudentPlacement,
  ): boolean => {
    const taskState = getPlacementTaskState(placement.id);
    if (!taskState) return true; // New placements without task state are active

    // A placement is active if final publish (task 7/7) is not completed
    return !taskState.completedTasks.includes("7");
  };

  // Get active placements (not all tasks completed)
  const activePlacements = placements.filter(isPlacementActive);

  // Helper to get study and program names
  const getStudyProgramDisplay = (studyId: string, programId: string) => {
    const study = studies.find(s => s.id === studyId);
    const program = study?.programs.find(p => p.id === programId);
    if (!study || !program) return 'N/A';
    return `${study.name} / ${program.name}`;
  };

  // Calculate students placed/not placed for each placement
  const getPlacementStats = (placement: StudentPlacement) => {
    const taskState = getPlacementTaskState(placement.id);
    const totalStudents = placement.students;
    const studentsPlaced =
      taskState?.students?.filter(
        (s: any) => s.assignedPraksisPlace,
      ).length || 0;
    const studentsNotPlaced = totalStudents - studentsPlaced;

    return { studentsPlaced, studentsNotPlaced };
  };

  // Helper function to get status badge class for quota requests
  const getQuotaStatusBadgeClass = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-300";
      case "approved":
        return "bg-green-50 text-green-700 border-green-300";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-300";
      case "fulfilled":
        return "bg-blue-50 text-blue-700 border-blue-300";
      default:
        return "";
    }
  };

  // Helper function to format date range for quota requests
  const formatQuotaDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const formatDate = (date: Date) =>
      `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString().slice(-2)}`;
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  // Generate tasks (show only the current incomplete task for each active placement)
  const generateTasks = (): DashboardTask[] => {
    const tasks: DashboardTask[] = [];

    activePlacements.forEach((placement) => {
      const taskState = getPlacementTaskState(placement.id);
      const completedTaskIds = taskState?.completedTasks || [];

      // Find the first incomplete task
      const currentTask = placementTasksDefinition.find(
        (task) => !completedTaskIds.includes(task.id),
      );

      if (currentTask) {
        // Determine priority based on task step
        let priority: "high" | "medium" | "low" = "medium";
        if (currentTask.step === "6/6") priority = "high";
        else if (currentTask.step === "1/6")
          priority = "high";
        else if (currentTask.status === "mandatory")
          priority = "medium";
        else priority = "low";

        tasks.push({
          id: `task-${placement.id}-${currentTask.id}`,
          placementId: placement.id,
          placementTitle: placement.title,
          step: currentTask.step,
          title: currentTask.title,
          description: currentTask.description,
          timestamp: new Date().toISOString(), // Use placement creation date if available
          priority,
        });
      }
    });

    // Sort by priority
    return tasks.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      if (
        priorityOrder[a.priority] !== priorityOrder[b.priority]
      ) {
        return (
          priorityOrder[a.priority] - priorityOrder[b.priority]
        );
      }
      return (
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime()
      );
    });
  };

  // Generate activities (completed tasks + other activities)
  const generateActivities = (): Activity[] => {
    const activities: Activity[] = [];

    // Add completed tasks as activities
    placements.forEach((placement) => {
      const taskState = getPlacementTaskState(placement.id);
      const completedTaskIds = taskState?.completedTasks || [];

      completedTaskIds.forEach((taskId) => {
        const task = placementTasksDefinition.find(
          (t) => t.id === taskId,
        );
        if (task) {
          activities.push({
            id: `activity-task-${placement.id}-${taskId}`,
            type: "task_completed",
            title: `Completed: ${task.title}`,
            description: `${task.step} completed for ${placement.title}`,
            timestamp: new Date().toISOString(), // Would use actual completion timestamp
            placementTitle: placement.title,
          });
        }
      });
    });

    // Sort by timestamp (most recent first)
    return activities.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() -
        new Date(a.timestamp).getTime(),
    );
  };

  const tasks = generateTasks();
  const activities = generateActivities();

  // Calculate yearly statistics
  const calculateYearlyStats = () => {
    // Group placements by year
    const yearlyData: {
      [year: string]: {
        completedPlacements: number;
        totalStudents: number;
      };
    } = {};

    placements.forEach((placement) => {
      const year = placement.year;
      if (!yearlyData[year]) {
        yearlyData[year] = {
          completedPlacements: 0,
          totalStudents: 0,
        };
      }

      // Count completed placements (status is "completed")
      if (placement.status === "completed") {
        yearlyData[year].completedPlacements += 1;
      }

      // Sum students
      yearlyData[year].totalStudents += placement.students;
    });

    // Convert to array and sort by year (descending)
    const yearlyArray = Object.entries(yearlyData)
      .map(([year, data]) => ({
        year,
        completedPlacements: data.completedPlacements,
        students: data.totalStudents,
      }))
      .sort((a, b) => parseInt(b.year) - parseInt(a.year));

    // Calculate year-over-year changes
    const yearlyWithChanges = yearlyArray.map(
      (current, index) => {
        const previous = yearlyArray[index + 1];
        let placementChange = 0;
        let studentChange = 0;

        if (previous) {
          placementChange =
            previous.completedPlacements > 0
              ? Math.round(
                  ((current.completedPlacements -
                    previous.completedPlacements) /
                    previous.completedPlacements) *
                    100,
                )
              : current.completedPlacements > 0
                ? 100
                : 0;

          studentChange =
            previous.students > 0
              ? Math.round(
                  ((current.students - previous.students) /
                    previous.students) *
                    100,
                )
              : current.students > 0
                ? 100
                : 0;
        }

        return {
          ...current,
          placementChange,
          studentChange,
          hasPrevious: !!previous,
        };
      },
    );

    return yearlyWithChanges;
  };

  const yearlyStats = calculateYearlyStats();

  // Pagination
  const paginatedTasks = tasks.slice(
    (tasksPage - 1) * itemsPerPage,
    tasksPage * itemsPerPage,
  );
  const paginatedActivities = activities.slice(
    (activitiesPage - 1) * itemsPerPage,
    activitiesPage * itemsPerPage,
  );
  const totalTasksPages = Math.ceil(
    tasks.length / itemsPerPage,
  );
  const totalActivitiesPages = Math.ceil(
    activities.length / itemsPerPage,
  );

  const getStatusColor = (
    status: StudentPlacement["status"],
  ) => {
    switch (status) {
      case "upload":
        return "bg-orange-50 text-orange-600 border-orange-200";
      case "select":
        return "bg-red-50 text-red-600 border-red-200";
      case "publish":
        return "bg-blue-50 text-blue-600 border-blue-200";
      case "completed":
        return "bg-green-50 text-green-600 border-green-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getStatusLabel = (
    status: StudentPlacement["status"],
  ) => {
    switch (status) {
      case "upload":
        return "Upload students";
      case "select":
        return "Select praksis places";
      case "publish":
        return "First publish";
      case "completed":
        return "Completed";
      default:
        return status;
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

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Dashboard
        </h1>
        <p className="text-gray-600">
          Overview of your student placements
        </p>
      </div>

      {/* Praksis Places Overview */}
      {dashboardSettings.praksisPlacesOverview && (
      <div>
        <div className="mb-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Praksis Places Overview
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-5 text-gray-500 hover:text-gray-700 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  Display Settings
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Rows to display
                  </div>
                  <DropdownMenuRadioGroup
                    value={praksisPlaceItemsToShow}
                    onValueChange={setPraksisPlaceItemsToShow}
                  >
                    <DropdownMenuRadioItem value="3">
                      3 rows
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="5">
                      5 rows
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="10">
                      10 rows
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  Visible Columns
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={praksisPlaceColumns.name}
                  onCheckedChange={(checked) =>
                    setPraksisPlaceColumns({
                      ...praksisPlaceColumns,
                      name: checked,
                    })
                  }
                >
                  Name
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={praksisPlaceColumns.address}
                  onCheckedChange={(checked) =>
                    setPraksisPlaceColumns({
                      ...praksisPlaceColumns,
                      address: checked,
                    })
                  }
                >
                  Address
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={praksisPlaceColumns.city}
                  onCheckedChange={(checked) =>
                    setPraksisPlaceColumns({
                      ...praksisPlaceColumns,
                      city: checked,
                    })
                  }
                >
                  City
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={praksisPlaceColumns.departments}
                  onCheckedChange={(checked) =>
                    setPraksisPlaceColumns({
                      ...praksisPlaceColumns,
                      departments: checked,
                    })
                  }
                >
                  Departments
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={praksisPlaceColumns.capacity}
                  onCheckedChange={(checked) =>
                    setPraksisPlaceColumns({
                      ...praksisPlaceColumns,
                      capacity: checked,
                    })
                  }
                >
                  Capacity
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={praksisPlaceColumns.currentStudents}
                  onCheckedChange={(checked) =>
                    setPraksisPlaceColumns({
                      ...praksisPlaceColumns,
                      currentStudents: checked,
                    })
                  }
                >
                  Current Students
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="relative ml-2">
              {praksisPlaces.length === 0 && (
                <>
                  {/* Animated rings around + button */}
                  <div className="absolute -inset-2 rounded-full animate-ping bg-blue-500" style={{ animationDuration: '2s', opacity: 0.4 }}></div>
                  <div className="absolute -inset-1.5 rounded-full animate-pulse bg-blue-400" style={{ animationDuration: '2.5s', opacity: 0.3 }}></div>
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-white via-white to-white opacity-30 animate-pulse-slow"></div>
                </>
              )}
              <button
                className="text-blue-600 hover:text-blue-700 transition-colors relative z-10"
                onClick={onViewAllPraksisPlacesClick}
                title="Add new praksis place"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>
          </div>
          {praksisPlaces.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Displaying{" "}
              {Math.min(
                parseInt(praksisPlaceItemsToShow),
                praksisPlaces.length,
              )}{" "}
              of {praksisPlaces.length} total praksis places.{" "}
              {praksisPlaces.length >
                parseInt(praksisPlaceItemsToShow) && (
                <button
                  onClick={onViewAllPraksisPlacesClick}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Click here to see all
                </button>
              )}
            </p>
          )}
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {praksisPlaceColumns.name && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                  )}
                  {praksisPlaceColumns.address && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Address
                    </th>
                  )}
                  {praksisPlaceColumns.city && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      City
                    </th>
                  )}
                  {praksisPlaceColumns.departments && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Departments
                    </th>
                  )}
                  {praksisPlaceColumns.capacity && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Capacity
                    </th>
                  )}
                  {praksisPlaceColumns.currentStudents && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Current Students
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {praksisPlaces.length > 0 ? (
                  praksisPlaces
                    .slice(0, parseInt(praksisPlaceItemsToShow))
                    .map((place) => {
                      return (
                        <tr
                          key={place.id}
                          onClick={() =>
                            onPraksisPlaceClick?.(place)
                          }
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          {praksisPlaceColumns.name && (
                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                              {place.name}
                            </td>
                          )}
                          {praksisPlaceColumns.address && (
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {place.address}
                            </td>
                          )}
                          {praksisPlaceColumns.city && (
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {place.city}
                            </td>
                          )}
                          {praksisPlaceColumns.departments && (
                            <td className="px-6 py-4 text-sm text-center text-gray-600">
                              {place.departments?.length || 0}
                            </td>
                          )}
                          {praksisPlaceColumns.capacity && (
                            <td className="px-6 py-4 text-sm text-center text-gray-600">
                              {place.totalCapacity}
                            </td>
                          )}
                          {praksisPlaceColumns.currentStudents && (
                            <td className="px-6 py-4 text-sm text-center">
                              <span
                                className={`font-semibold ${
                                  place.currentStudents >=
                                  place.totalCapacity
                                    ? "text-red-600"
                                    : place.currentStudents >
                                        place.totalCapacity *
                                          0.7
                                      ? "text-orange-600"
                                      : "text-green-600"
                                }`}
                              >
                                {place.currentStudents}
                              </span>
                              <span className="text-gray-400 ml-1">
                                / {place.totalCapacity}
                              </span>
                            </td>
                          )}
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No praksis places found. You need to
                      create at least 1 praksis place to start
                      student placement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      )}

      {/* Placement Overview */}
      {dashboardSettings.placementOverview && (
      <div>
        <div className="mb-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Placement Overview
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-5 text-gray-500 hover:text-gray-700 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  Display Settings
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Rows to display
                  </div>
                  <DropdownMenuRadioGroup
                    value={placementItemsToShow}
                    onValueChange={setPlacementItemsToShow}
                  >
                    <DropdownMenuRadioItem value="3">
                      3 rows
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="5">
                      5 rows
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="10">
                      10 rows
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  Visible Columns
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={placementColumns.title}
                  onCheckedChange={(checked) =>
                    setPlacementColumns({
                      ...placementColumns,
                      title: checked,
                    })
                  }
                >
                  Title
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={placementColumns.year}
                  onCheckedChange={(checked) =>
                    setPlacementColumns({
                      ...placementColumns,
                      year: checked,
                    })
                  }
                >
                  Year
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={placementColumns.semester}
                  onCheckedChange={(checked) =>
                    setPlacementColumns({
                      ...placementColumns,
                      semester: checked,
                    })
                  }
                >
                  Semester
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={placementColumns.subject}
                  onCheckedChange={(checked) =>
                    setPlacementColumns({
                      ...placementColumns,
                      subject: checked,
                    })
                  }
                >
                  Emne
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={placementColumns.study}
                  onCheckedChange={(checked) =>
                    setPlacementColumns({
                      ...placementColumns,
                      study: checked,
                    })
                  }
                >
                  Study / Program
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={placementColumns.dateRange}
                  onCheckedChange={(checked) =>
                    setPlacementColumns({
                      ...placementColumns,
                      dateRange: checked,
                    })
                  }
                >
                  Start-End Date
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={placementColumns.studentsPlaced}
                  onCheckedChange={(checked) =>
                    setPlacementColumns({
                      ...placementColumns,
                      studentsPlaced: checked,
                    })
                  }
                >
                  Students Placed
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={placementColumns.status}
                  onCheckedChange={(checked) =>
                    setPlacementColumns({
                      ...placementColumns,
                      status: checked,
                    })
                  }
                >
                  Status
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              className="ml-2 text-blue-600 hover:text-blue-700 transition-colors"
              onClick={onViewAllClick}
              title="Add new placement"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          {activePlacements.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Displaying{" "}
              {Math.min(
                parseInt(placementItemsToShow),
                activePlacements.length,
              )}{" "}
              of {activePlacements.length} total placements.{" "}
              {activePlacements.length >
                parseInt(placementItemsToShow) && (
                <button
                  onClick={onViewAllClick}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Click here to see all
                </button>
              )}
            </p>
          )}
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {placementColumns.study && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Study / Program
                    </th>
                  )}
                  {placementColumns.title && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Title
                    </th>
                  )}
                  {placementColumns.year && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                  )}
                  {placementColumns.semester && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Semester
                    </th>
                  )}
                  {placementColumns.subject && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Emne
                    </th>
                  )}
                  {placementColumns.dateRange && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Start-End Date
                    </th>
                  )}
                  {placementColumns.studentsPlaced && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Students Placed
                    </th>
                  )}
                  {placementColumns.status && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {activePlacements.length > 0 ? (
                  activePlacements
                    .slice(0, parseInt(placementItemsToShow))
                    .map((placement) => {
                      const stats =
                        getPlacementStats(placement);
                      return (
                        <tr
                          key={placement.id}
                          onClick={() =>
                            onPlacementClick?.(placement)
                          }
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          {placementColumns.study && (
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {getStudyProgramDisplay(placement.studyId, placement.programId)}
                            </td>
                          )}
                          {placementColumns.title && (
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {placement.title}
                            </td>
                          )}
                          {placementColumns.year && (
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {placement.year}
                            </td>
                          )}
                          {placementColumns.semester && (
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {placement.semester}
                            </td>
                          )}
                          {placementColumns.subject && (
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {placement.subject}
                            </td>
                          )}
                          {placementColumns.dateRange && (
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {formatDateRange(
                                placement.startDate,
                                placement.endDate,
                              )}
                            </td>
                          )}
                          {placementColumns.studentsPlaced && (
                            <td className="px-6 py-4 text-sm text-center">
                              <span className="font-semibold text-green-600">
                                {stats.studentsPlaced}
                              </span>
                              <span className="text-gray-400 ml-1">
                                / {placement.students}
                              </span>
                            </td>
                          )}
                          {placementColumns.status && (
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                <Badge
                                  variant="outline"
                                  className={`${getStatusColor(placement.status)} text-xs font-medium px-2.5 py-0.5`}
                                >
                                  {getStatusLabel(
                                    placement.status,
                                  )}
                                </Badge>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >No active placements found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      )}

      {/* Quota Requests */}
      {dashboardSettings.quotaRequests && (
      <div>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Quota Requests
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-5 text-gray-500 hover:text-gray-700 transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    Display Settings
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      Rows to display
                    </div>
                    <DropdownMenuRadioGroup
                      value={quotaRequestsItemsToShow}
                      onValueChange={setQuotaRequestsItemsToShow}
                    >
                      <DropdownMenuRadioItem value="3">
                        3 rows
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="5">
                        5 rows
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="10">
                        10 rows
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>
                    Visible Columns
                  </DropdownMenuLabel>
                  <DropdownMenuCheckboxItem
                    checked={quotaRequestsColumns.place}
                    onCheckedChange={(checked) =>
                      setQuotaRequestsColumns({
                        ...quotaRequestsColumns,
                        place: checked,
                      })
                    }
                  >
                    Praksis Place
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={quotaRequestsColumns.study}
                    onCheckedChange={(checked) =>
                      setQuotaRequestsColumns({
                        ...quotaRequestsColumns,
                        study: checked,
                      })
                    }
                  >
                    Study / Program
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={quotaRequestsColumns.requested}
                    onCheckedChange={(checked) =>
                      setQuotaRequestsColumns({
                        ...quotaRequestsColumns,
                        requested: checked,
                      })
                    }
                  >
                    Requested
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={quotaRequestsColumns.approved}
                    onCheckedChange={(checked) =>
                      setQuotaRequestsColumns({
                        ...quotaRequestsColumns,
                        approved: checked,
                      })
                    }
                  >
                    Approved
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={quotaRequestsColumns.period}
                    onCheckedChange={(checked) =>
                      setQuotaRequestsColumns({
                        ...quotaRequestsColumns,
                        period: checked,
                      })
                    }
                  >
                    Period
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={quotaRequestsColumns.status}
                    onCheckedChange={(checked) =>
                      setQuotaRequestsColumns({
                        ...quotaRequestsColumns,
                        status: checked,
                      })
                    }
                  >
                    Status
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={quotaRequestsColumns.actions}
                    onCheckedChange={(checked) =>
                      setQuotaRequestsColumns({
                        ...quotaRequestsColumns,
                        actions: checked,
                      })
                    }
                  >
                    Actions
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {onViewAllQuotaRequestsClick && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewAllQuotaRequestsClick}
                className="gap-2"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Track your quota requests and their approval status
          </p>
        </div>

        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {quotaRequestsColumns.place && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Praksis Place / Department
                    </th>
                  )}
                  {quotaRequestsColumns.study && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Study / Program
                    </th>
                  )}
                  {quotaRequestsColumns.requested && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Requested
                    </th>
                  )}
                  {quotaRequestsColumns.approved && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Approved
                    </th>
                  )}
                  {quotaRequestsColumns.period && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Period
                    </th>
                  )}
                  {quotaRequestsColumns.status && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  )}
                  {quotaRequestsColumns.actions && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {coordinatorQuotaRequests.length > 0 ? (
                  coordinatorQuotaRequests
                    .slice(0, parseInt(quotaRequestsItemsToShow))
                    .map((request) => (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        {quotaRequestsColumns.place && (
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800">
                              {request.praksisPlaceName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {request.departmentName}
                            </div>
                          </td>
                        )}
                        {quotaRequestsColumns.study && (
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-800">
                              {request.studyName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {request.programName}
                            </div>
                          </td>
                        )}
                        {quotaRequestsColumns.requested && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              <span className="text-lg font-bold text-purple-600">
                                {request.requestedCapacity}
                              </span>
                            </div>
                          </td>
                        )}
                        {quotaRequestsColumns.approved && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center">
                              {request.status === 'approved' && request.approvedCapacity !== undefined ? (
                                <span className="text-lg font-bold text-green-600">
                                  {request.approvedCapacity}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                        )}
                        {quotaRequestsColumns.period && (
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatQuotaDateRange(
                                request.startDate,
                                request.endDate,
                              )}
                            </div>
                          </td>
                        )}
                        {quotaRequestsColumns.status && (
                          <td className="px-6 py-4">
                            <Badge
                              variant="outline"
                              className={`${getQuotaStatusBadgeClass(request.status)} flex items-center gap-1 w-fit`}
                            >
                              {request.status === 'pending' && <Clock className="h-3 w-3" />}
                              {request.status === 'approved' && <CheckCircle className="h-3 w-3" />}
                              {request.status === 'rejected' && <X className="h-3 w-3" />}
                              {request.status === 'fulfilled' && <CheckCircle className="h-3 w-3" />}
                              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                            </Badge>
                          </td>
                        )}
                        {quotaRequestsColumns.actions && (
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onQuotaRequestNavigate?.(request)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Create Placement Task"
                              >
                                <ArrowRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>No quota requests found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      )}

      {/* Tasks and Recent Activities */}
      {(dashboardSettings.tasks || dashboardSettings.recentActivities) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks */}
        {dashboardSettings.tasks && (
        <div>
          <div className="mb-4">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Tasks
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-5 text-gray-500 hover:text-gray-700 transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                >
                  <DropdownMenuLabel>
                    Display Settings
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      Tasks to display
                    </div>
                    <DropdownMenuRadioGroup
                      value={tasksToShow.toString()}
                      onValueChange={(value) =>
                        setTasksToShow(parseInt(value))
                      }
                    >
                      <DropdownMenuRadioItem value="3">
                        3 tasks
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="5">
                        5 tasks
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="10">
                        10 tasks
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {tasks.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Displaying {Math.min(tasksToShow, tasks.length)}{" "}
                of {tasks.length} total tasks.{" "}
                {tasks.length > tasksToShow && (
                  <button
                    onClick={() => setShowAllTasksOverlay(true)}
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    Click here to see all
                  </button>
                )}
              </p>
            )}
          </div>
          <Card className="p-5">
            <div className="space-y-4">
              {tasks.length > 0 ? (
                <>
                  {tasks.slice(0, tasksToShow).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => {
                        const placement = placements.find(
                          (p) => p.id === task.placementId,
                        );
                        if (placement && onPlacementClick) {
                          onPlacementClick(placement);
                        }
                      }}
                      className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 rounded-lg p-3 -m-3 transition-colors"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          task.priority === "high"
                            ? "bg-red-100"
                            : task.priority === "medium"
                              ? "bg-yellow-100"
                              : "bg-green-100"
                        }`}
                      >
                        <ClipboardList
                          className={`h-5 w-5 ${
                            task.priority === "high"
                              ? "text-red-600"
                              : task.priority === "medium"
                                ? "text-yellow-600"
                                : "text-green-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-gray-800">
                            {task.step} - {task.title}
                          </div>
                          <Badge
                            className={`text-xs ${
                              task.priority === "high"
                                ? "bg-red-100 text-red-700 border-red-200"
                                : task.priority === "medium"
                                  ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                  : "bg-green-100 text-green-700 border-green-200"
                            }`}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {task.placementTitle}
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No pending tasks</p>
                  <p className="text-xs mt-1">
                    All placement tasks are completed
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
        )}

        {/* Recent Activities */}
        {dashboardSettings.recentActivities && (
        <div>
          <div className="mb-4">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold text-gray-800">
                Recent Activities
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="ml-5 text-gray-500 hover:text-gray-700 transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56"
                >
                  <DropdownMenuLabel>
                    Display Settings
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      Activities to display
                    </div>
                    <DropdownMenuRadioGroup
                      value={activitiesToShow.toString()}
                      onValueChange={(value) =>
                        setActivitiesToShow(parseInt(value))
                      }
                    >
                      <DropdownMenuRadioItem value="3">
                        3 activities
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="5">
                        5 activities
                      </DropdownMenuRadioItem>
                      <DropdownMenuRadioItem value="10">
                        10 activities
                      </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {activities.length > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                Displaying{" "}
                {Math.min(activitiesToShow, activities.length)}{" "}
                of {activities.length} total activities.{" "}
                {activities.length > activitiesToShow && (
                  <button
                    onClick={() =>
                      setShowAllActivitiesOverlay(true)
                    }
                    className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                  >
                    Click here to see all
                  </button>
                )}
              </p>
            )}
          </div>
          <Card className="p-5">
            <div className="space-y-4">
              {activities.length > 0 ? (
                <>
                  {activities
                    .slice(0, activitiesToShow)
                    .map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                      >
                        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-800">
                            {activity.title}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {activity.description}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(
                              activity.timestamp,
                            ).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No recent activities</p>
                  <p className="text-xs mt-1">
                    Activity history will appear here
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
        )}
      </div>
      )}

      {/* Placement Progress */}
      {dashboardSettings.placementProgress && (
      <div className="pb-[50px]">
        <div className="mb-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Placement Progress
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-5 text-gray-500 hover:text-gray-700 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  Display Settings
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Rows to display
                  </div>
                  <DropdownMenuRadioGroup
                    value={progressItemsToShow}
                    onValueChange={setProgressItemsToShow}
                  >
                    <DropdownMenuRadioItem value="3">
                      3 rows
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="5">
                      5 rows
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="10">
                      10 rows
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  Visible Columns
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={progressColumns.title}
                  onCheckedChange={(checked) =>
                    setProgressColumns({
                      ...progressColumns,
                      title: checked,
                    })
                  }
                >
                  Title
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={progressColumns.status}
                  onCheckedChange={(checked) =>
                    setProgressColumns({
                      ...progressColumns,
                      status: checked,
                    })
                  }
                >
                  Current Status
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={progressColumns.progress}
                  onCheckedChange={(checked) =>
                    setProgressColumns({
                      ...progressColumns,
                      progress: checked,
                    })
                  }
                >
                  Progress
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {activePlacements.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Displaying{" "}
              {Math.min(
                parseInt(progressItemsToShow),
                activePlacements.length,
              )}{" "}
              of {activePlacements.length} total placements.{" "}
              {activePlacements.length >
                parseInt(progressItemsToShow) && (
                <button
                  onClick={onViewAllClick}
                  className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                >
                  Click here to see all
                </button>
              )}
            </p>
          )}
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {progressColumns.title && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Title
                    </th>
                  )}
                  {progressColumns.status && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Current Status
                    </th>
                  )}
                  {progressColumns.progress && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Progress
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {activePlacements.length > 0 ? (
                  activePlacements
                    .slice(0, parseInt(progressItemsToShow))
                    .map((placement) => {
                      const taskState = getPlacementTaskState(
                        placement.id,
                      );
                      const completedTasks =
                        taskState?.completedTasks || [];
                      const totalTasks =
                        placementTasksDefinition.length;
                      const progressPercentage = Math.round(
                        (completedTasks.length / totalTasks) *
                          100,
                      );

                      return (
                        <tr
                          key={placement.id}
                          onClick={() =>
                            onPlacementClick?.(placement)
                          }
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          {progressColumns.title && (
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {placement.title}
                            </td>
                          )}
                          {progressColumns.status && (
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                <Badge
                                  variant="outline"
                                  className={`${getStatusColor(placement.status)} text-xs font-medium px-2.5 py-0.5`}
                                >
                                  {getStatusLabel(
                                    placement.status,
                                  )}
                                </Badge>
                              </div>
                            </td>
                          )}
                          {progressColumns.progress && (
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                                  <div
                                    className={`h-2.5 rounded-full transition-all ${
                                      progressPercentage === 100
                                        ? "bg-green-500"
                                        : progressPercentage >=
                                            70
                                          ? "bg-blue-500"
                                          : progressPercentage >=
                                              40
                                            ? "bg-yellow-500"
                                            : "bg-red-500"
                                    }`}
                                    style={{
                                      width: `${progressPercentage}%`,
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs font-medium text-gray-600 min-w-[45px] text-right">
                                  {progressPercentage}%
                                </span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {completedTasks.length} of{" "}
                                {totalTasks} tasks completed
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No active placements found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      )}

      {/* Yearly Placements Overview */}
      {dashboardSettings.yearlyPlacements && (
      <div className="pb-[50px]">
        <div className="mb-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Yearly Placements Overview
            </h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="ml-5 text-gray-500 hover:text-gray-700 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  Display Settings
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    Rows to display
                  </div>
                  <DropdownMenuRadioGroup
                    value={yearlyItemsToShow}
                    onValueChange={setYearlyItemsToShow}
                  >
                    <DropdownMenuRadioItem value="3">
                      3 rows
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="5">
                      5 rows
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="10">
                      10 rows
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>
                  Visible Columns
                </DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={yearlyColumns.year}
                  onCheckedChange={(checked) =>
                    setYearlyColumns({
                      ...yearlyColumns,
                      year: checked,
                    })
                  }
                >
                  Year
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={yearlyColumns.completedPlacements}
                  onCheckedChange={(checked) =>
                    setYearlyColumns({
                      ...yearlyColumns,
                      completedPlacements: checked,
                    })
                  }
                >
                  Completed Placements
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={yearlyColumns.students}
                  onCheckedChange={(checked) =>
                    setYearlyColumns({
                      ...yearlyColumns,
                      students: checked,
                    })
                  }
                >
                  Students
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={yearlyColumns.change}
                  onCheckedChange={(checked) =>
                    setYearlyColumns({
                      ...yearlyColumns,
                      change: checked,
                    })
                  }
                >
                  Increase/Decrease
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {yearlyStats.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Displaying{" "}
              {Math.min(
                parseInt(yearlyItemsToShow),
                yearlyStats.length,
              )}{" "}
              of {yearlyStats.length} total years.
            </p>
          )}
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {yearlyColumns.year && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Year
                    </th>
                  )}
                  {yearlyColumns.completedPlacements && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Completed Placements
                    </th>
                  )}
                  {yearlyColumns.students && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Students
                    </th>
                  )}
                  {yearlyColumns.change && (
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Increase/Decrease
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {yearlyStats.length > 0 ? (
                  yearlyStats
                    .slice(0, parseInt(yearlyItemsToShow))
                    .map((yearData) => {
                      return (
                        <tr
                          key={yearData.year}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {yearlyColumns.year && (
                            <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                              {yearData.year}
                            </td>
                          )}
                          {yearlyColumns.completedPlacements && (
                            <td className="px-6 py-4 text-sm text-center text-gray-600 font-semibold">
                              {yearData.completedPlacements}
                            </td>
                          )}
                          {yearlyColumns.students && (
                            <td className="px-6 py-4 text-sm text-center text-gray-600 font-semibold">
                              {yearData.students}
                            </td>
                          )}
                          {yearlyColumns.change && (
                            <td className="px-6 py-4">
                              {yearData.hasPrevious ? (
                                <div className="flex items-center justify-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">
                                      Placements:
                                    </span>
                                    <span
                                      className={`text-sm font-semibold ${
                                        yearData.placementChange >
                                        0
                                          ? "text-green-600"
                                          : yearData.placementChange <
                                              0
                                            ? "text-red-600"
                                            : "text-gray-600"
                                      }`}
                                    >
                                      {yearData.placementChange >
                                        0 && "↑"}
                                      {yearData.placementChange <
                                        0 && "↓"}
                                      {yearData.placementChange ===
                                        0 && "→"}{" "}
                                      {Math.abs(
                                        yearData.placementChange,
                                      )}
                                      %
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500">
                                      Students:
                                    </span>
                                    <span
                                      className={`text-sm font-semibold ${
                                        yearData.studentChange >
                                        0
                                          ? "text-green-600"
                                          : yearData.studentChange <
                                              0
                                            ? "text-red-600"
                                            : "text-gray-600"
                                      }`}
                                    >
                                      {yearData.studentChange >
                                        0 && "↑"}
                                      {yearData.studentChange <
                                        0 && "↓"}
                                      {yearData.studentChange ===
                                        0 && "→"}{" "}
                                      {Math.abs(
                                        yearData.studentChange,
                                      )}
                                      %
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center text-xs text-gray-400">
                                  No previous year
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No yearly data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      )}

      {/* All Tasks Overlay */}
      {showAllTasksOverlay && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.5)]"
            onClick={() => setShowAllTasksOverlay(false)}
          />

          {/* Overlay Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-1/3 bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                All Tasks ({tasks.length})
              </h2>
              <button
                onClick={() => setShowAllTasksOverlay(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Tasks List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => {
                      const placement = placements.find(
                        (p) => p.id === task.placementId,
                      );
                      if (placement && onPlacementClick) {
                        setShowAllTasksOverlay(false);
                        onPlacementClick(placement);
                      }
                    }}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 cursor-pointer hover:bg-gray-50 rounded-lg p-3 -m-3 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        task.priority === "high"
                          ? "bg-red-100"
                          : task.priority === "medium"
                            ? "bg-yellow-100"
                            : "bg-green-100"
                      }`}
                    >
                      <ClipboardList
                        className={`h-5 w-5 ${
                          task.priority === "high"
                            ? "text-red-600"
                            : task.priority === "medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-gray-800">
                          {task.step} - {task.title}
                        </div>
                        <Badge
                          className={`text-xs ${
                            task.priority === "high"
                              ? "bg-red-100 text-red-700 border-red-200"
                              : task.priority === "medium"
                                ? "bg-yellow-100 text-yellow-700 border-yellow-200"
                                : "bg-green-100 text-green-700 border-green-200"
                          }`}
                        >
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {task.placementTitle}
                      </div>
                      <div className="text-xs text-gray-500">
                        {task.description}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* All Activities Overlay */}
      {showAllActivitiesOverlay && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-[rgba(0,0,0,0.5)]"
            onClick={() => setShowAllActivitiesOverlay(false)}
          />

          {/* Overlay Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-1/3 bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                All Activities ({activities.length})
              </h2>
              <button
                onClick={() =>
                  setShowAllActivitiesOverlay(false)
                }
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Activities List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-green-100">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800">
                        {activity.title}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {activity.description}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(
                          activity.timestamp,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}