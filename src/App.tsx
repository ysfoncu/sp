import React, { useState, useEffect } from "react";
import {
  mockStudentPlacements,
  StudentPlacement,
  PlacementTaskState,
  mockPlacementTaskStates,
} from "./types/studentPlacement";
import { mockStudents, Student } from "./types/placementTask";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./components/ui/select";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  CheckCircle,
  Building2,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { EnhancedSidebar } from "./components/EnhancedSidebar";
import { FilterModal } from "./components/FilterModal";
import { FilterChips } from "./components/FilterChips";
import { GanttView } from "./components/GanttView";
import { TableView } from "./components/TableView";
import { Dashboard } from "./components/Dashboard";
import { PraksisPlacesView } from "./components/PraksisPlacesView";
import { PraksisPlaceDetailModal } from "./components/PraksisPlaceDetailModal";
import { PraksisPlaceDetailView } from "./components/PraksisPlaceDetailView";
import { CreatePraksisPlaceView } from "./components/CreatePraksisPlaceView";
import { AddDepartmentMemberModal } from "./components/AddDepartmentMemberModal";
import { UnderConstruction } from "./components/UnderConstruction";
import { AnalyticsAI } from "./components/AnalyticsAI";
import { PlacementTaskView } from "./components/PlacementTaskView";
import { LoginScreen } from "./components/LoginScreen";
import {
  SettingsView,
  DashboardSettings,
  Study,
  StudyProgram,
} from "./components/SettingsView";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";
import {
  mockPraksisPlaces,
  PraksisPlace,
  mockQuotaRequests,
  QuotaRequest,
  Department,
} from "./types/praksisPlace";
import {
  mockQuotaOfferings,
  QuotaOffering,
} from "./types/quotaOffering";
import {
  mockCoordinatorQuotaRequests,
  CoordinatorQuotaRequest,
} from "./types/coordinatorQuotaRequest";
import { CoordinatorQuotasView } from "./components/CoordinatorQuotasView";
import { FloatingOnboardingButton } from "./components/FloatingOnboardingButton";
import { OnboardingOverlay } from "./components/OnboardingOverlay";
import { OnboardingCommentsView } from "./components/OnboardingCommentsView";
import { PlacementTaskHelpOverlay } from "./components/PlacementTaskHelpOverlay";

type UserRole = "PK";

function Navbar({
  onGenerateMockPlacement,
  onLogout,
}: {
  onGenerateMockPlacement?: () => void;
  onLogout?: () => void;
}) {
  return (
    <div className="bg-white relative shrink-0 w-full border-b border-zinc-100">
      <div className="flex flex-row items-center justify-between relative size-full px-3 sm:px-6 py-3">
        {/* Logo/Brand Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-blue-600 text-white font-bold text-sm px-3 py-2 rounded">
            SP
          </div>
          <span className="font-semibold text-gray-800 hidden sm:inline">
            Student Placement
          </span>
        </div>

        {/* User Info Section */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Role Switcher Buttons */}

          {/* Notification Bell */}

          {/* User Profile */}
        </div>
      </div>
    </div>
  );
}

function CreatePlacementButton({
  onCreatePlacement,
  onboardingStep,
  onboardingData,
  setOnboardingStep,
}: {
  onCreatePlacement: () => void;
  onboardingStep?: number;
  onboardingData?: any;
  setOnboardingStep?: (step: number) => void;
}) {
  const handleClick = () => {
    // Create draft placement and navigate
    onCreatePlacement();

    // Progress onboarding if step 2
    if (onboardingStep === 2 && setOnboardingStep) {
      setTimeout(() => {
        setOnboardingStep(3);
      }, 100);
    }
  };

  return (
    <Button
      className="bg-blue-600 hover:bg-blue-700 text-white"
      onClick={handleClick}
    >
      Create new student placement
    </Button>
  );
}

export default function App() {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] =
    useState<boolean>(() => {
      // Check if user is already authenticated from localStorage
      return (
        localStorage.getItem("spm_authenticated") === "true"
      );
    });

  // Quota Requests State
  const [quotaRequests, setQuotaRequests] = useState<
    QuotaRequest[]
  >(mockQuotaRequests);

  // Student Placements State
  const [studentPlacements, setStudentPlacements] = useState<
    StudentPlacement[]
  >(mockStudentPlacements);

  // Praksis Places State
  const [praksisPlaces, setPraksisPlaces] = useState<
    PraksisPlace[]
  >(mockPraksisPlaces);

  // Placement Task States - stores working state of each placement
  const [placementTaskStates, setPlacementTaskStates] =
    useState<PlacementTaskState[]>(mockPlacementTaskStates);

  // Quota Request Prefill Data - stores data from quota request to prefill placement form
  const [quotaRequestPrefillData, setQuotaRequestPrefillData] =
    useState<{
      studyId: string;
      programId: string;
      subject: string;
      startDate: string;
      endDate: string;
    } | null>(null);

  // Dashboard Settings State - controls which dashboard sections are visible
  const [dashboardSettings, setDashboardSettings] =
    useState<DashboardSettings>({
      praksisPlacesOverview: false,
      placementOverview: true,
      quotaRequests: true,
      tasks: true,
      recentActivities: true,
      placementProgress: true,
      yearlyPlacements: true,
    });

  // Studies State - for managing academic studies and programs
  const [studies, setStudies] = useState<Study[]>([
    {
      id: "1",
      name: "Helse-, sosial og idrettsfag",
      universityId: "U1",
      universityName: "University of Oslo",
      programs: [
        { id: "1-1", name: "Nursing" },
        { id: "1-2", name: "Physiotherapy" },
      ],
    },
  ]);

  // Quota Offerings State - SK person offering capacity to universities/programs
  const [quotaOfferings, setQuotaOfferings] = useState<
    QuotaOffering[]
  >(mockQuotaOfferings);

  // Coordinator Quota Requests State - PK person requesting capacity from praksis places
  const [
    coordinatorQuotaRequests,
    setCoordinatorQuotaRequests,
  ] = useState<CoordinatorQuotaRequest[]>(() => {
    // Try to load from localStorage first
    const stored = localStorage.getItem(
      "coordinatorQuotaRequests",
    );
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error(
          "Failed to parse stored coordinator quota requests:",
          e,
        );
      }
    }
    return mockCoordinatorQuotaRequests;
  });

  // Persist coordinatorQuotaRequests to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(
      "coordinatorQuotaRequests",
      JSON.stringify(coordinatorQuotaRequests),
    );
  }, [coordinatorQuotaRequests]);

  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "placements"
    | "praksisplaces"
    | "quotas"
    | "settings"
    | "analytics"
    | "placementtask"
    | "onboarding-comments"
  >("dashboard");

  // Praksis Places Sub-view State
  const [praksisPlacesSubView, setPraksisPlacesSubView] =
    useState<"list" | "detail" | "create">("list");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedSemester, setSelectedSemester] =
    useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCompleted, setShowCompleted] = useState(true); // By default, show all placements including completed ones
  const [viewMode, setViewMode] = useState<"list" | "gantt">(
    "list",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [
    selectedStudentPlacement,
    setSelectedStudentPlacement,
  ] = useState<StudentPlacement | null>(null);
  const [selectedPraksisPlace, setSelectedPraksisPlace] =
    useState<PraksisPlace | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] =
    useState(false);
  const [isPraksisPlaceModalOpen, setIsPraksisPlaceModalOpen] =
    useState(false);

  // AI Support sidebar state
  const [isAISidebarOpen, setIsAISidebarOpen] = useState(false);

  // Onboarding state
  const [onboardingStep, setOnboardingStep] =
    useState<number>(0); // 0 = inactive, 1-4 = steps
  const [onboardingData, setOnboardingData] = useState({
    title: "Autumn 2025 - Healthcare",
    year: "2025",
    semester: "Autumn",
    subject: "Healthcare",
    students: 25,
    startDate: "2025-09-01",
    endDate: "2025-12-15",
  });

  // Onboarding overlay state
  const [isOnboardingOpen, setIsOnboardingOpen] =
    useState(false);
  const [initialOnboardingStep, setInitialOnboardingStep] =
    useState<number>(1);

  // Placement Task Help overlay state
  const [isPlacementHelpOpen, setIsPlacementHelpOpen] =
    useState(false);

  // Helper function to map currentView to onboarding step
  const getOnboardingStepForView = (view: string): number => {
    switch (view) {
      case "dashboard":
        return 2; // Dashboard Overview
      case "quotas":
        return 3; // Capacity Planning
      case "placements":
        return 4; // Student Placements
      case "praksisplaces":
        return 5; // Praksis Places
      default:
        return 1; // Welcome screen for unknown pages
    }
  };

  // Add Department Member Modal State
  const [showAddDepartmentModal, setShowAddDepartmentModal] =
    useState(false);
  const [newlyCreatedPlace, setNewlyCreatedPlace] =
    useState<PraksisPlace | null>(null);

  const handleCreatePlacement = () => {
    // Create a draft placement with empty fields
    const placement: StudentPlacement = {
      id: (studentPlacements.length + 1).toString(),
      title: "",
      year: "",
      semester: "",
      subject: "",
      startDate: "",
      endDate: "",
      students: 50,
      status: "draft" as const,
      studyId: "",
      programId: "",
    };
    setStudentPlacements([...studentPlacements, placement]);

    // Create empty placement task state for this new placement
    const newTaskState: PlacementTaskState = {
      placementId: placement.id,
      studentsImported: false,
      students: [],
      quotasSelected: false,
      quotas: [],
      firstPublished: false,
      studentsAssigned: false,
      documentsAttached: false,
      finalPublished: false,
      completedTasks: [],
    };
    setPlacementTaskStates([
      ...placementTaskStates,
      newTaskState,
    ]);

    // Navigate to the placement task view
    setSelectedStudentPlacement(placement);
    setCurrentView("placementtask");
  };

  const handlePlacementMetadataUpdate = (
    placementId: string,
    metadata: {
      title: string;
      year: string;
      semester: string;
      subject: string;
      startDate: string;
      endDate: string;
      students: number;
      studyId: string;
      programId: string;
    },
  ) => {
    setStudentPlacements((prev) =>
      prev.map((p) =>
        p.id === placementId
          ? {
              ...p,
              ...metadata,
            }
          : p,
      ),
    );

    // Update the selected placement if it's the one being updated
    if (selectedStudentPlacement?.id === placementId) {
      setSelectedStudentPlacement((prev) =>
        prev ? { ...prev, ...metadata } : prev,
      );
    }
  };

  const handleStatusChange = (
    placementId: string,
    newStatus: StudentPlacement["status"],
  ) => {
    setStudentPlacements((prev) =>
      prev.map((p) =>
        p.id === placementId ? { ...p, status: newStatus } : p,
      ),
    );
  };

  const handleStudentPlacementClick = (
    placement: StudentPlacement,
  ) => {
    setSelectedStudentPlacement(placement);
    setCurrentView("placementtask");
  };

  const handlePraksisPlaceClick = (place: PraksisPlace) => {
    setSelectedPraksisPlace(place);
    setPraksisPlacesSubView("detail");
  };

  const handlePraksisPlaceUpdate = (
    updatedPlace: PraksisPlace,
  ) => {
    // Calculate total capacity from departments
    const totalCapacity = updatedPlace.departments.reduce(
      (sum, dept) => sum + dept.capacity,
      0,
    );
    const placeWithCalculatedCapacity = {
      ...updatedPlace,
      totalCapacity,
    };

    setPraksisPlaces((prev) =>
      prev.map((p) =>
        p.id === placeWithCalculatedCapacity.id
          ? placeWithCalculatedCapacity
          : p,
      ),
    );

    // Update the selected place to reflect the changes
    if (
      selectedPraksisPlace &&
      selectedPraksisPlace.id === placeWithCalculatedCapacity.id
    ) {
      setSelectedPraksisPlace(placeWithCalculatedCapacity);
    }
  };

  const handlePraksisPlacesUpdate = (
    updatedPlaces: PraksisPlace[],
  ) => {
    setPraksisPlaces(updatedPlaces);
  };

  const handleCreatePraksisPlace = () => {
    setPraksisPlacesSubView("create");
  };

  const handleCreatePraksisPlaceSubmit = (
    newPlace: Omit<PraksisPlace, "id">,
  ) => {
    const place: PraksisPlace = {
      ...newPlace,
      id: (praksisPlaces.length + 1).toString(),
    };
    setPraksisPlaces([...praksisPlaces, place]);
    setSelectedPraksisPlace(place);
    setPraksisPlacesSubView("detail");
  };

  const handleBackToPraksisPlacesList = () => {
    setPraksisPlacesSubView("list");
    setSelectedPraksisPlace(null);
  };

  // Quota Offering Handlers
  const handleQuotaOfferingCreate = (
    offering: Omit<
      QuotaOffering,
      "id" | "createdDate" | "updatedDate"
    >,
  ) => {
    const now = new Date().toISOString();
    const newOffering: QuotaOffering = {
      ...offering,
      id: `qo-${Date.now()}`,
      createdDate: now,
      updatedDate: now,
    };
    setQuotaOfferings([...quotaOfferings, newOffering]);
    toast.success("Quota offering created successfully");
  };

  const handleQuotaOfferingUpdate = (
    id: string,
    offering: Omit<
      QuotaOffering,
      "id" | "createdDate" | "updatedDate"
    >,
  ) => {
    setQuotaOfferings((prev) =>
      prev.map((qo) =>
        qo.id === id
          ? {
              ...offering,
              id: qo.id,
              createdDate: qo.createdDate,
              updatedDate: new Date().toISOString(),
            }
          : qo,
      ),
    );
    toast.success("Quota offering updated successfully");
  };

  const handleQuotaOfferingDelete = (id: string) => {
    setQuotaOfferings((prev) =>
      prev.filter((qo) => qo.id !== id),
    );
    toast.success("Quota offering deleted successfully");
  };

  const handleQuotaOfferingStatusToggle = (id: string) => {
    setQuotaOfferings((prev) =>
      prev.map((qo) =>
        qo.id === id
          ? {
              ...qo,
              status:
                qo.status === "active" ? "inactive" : "active",
              updatedDate: new Date().toISOString(),
            }
          : qo,
      ),
    );
  };

  // Coordinator Quota Request Handlers
  const handleCoordinatorQuotaRequestCreate = (
    request: Omit<
      CoordinatorQuotaRequest,
      "id" | "requestedDate" | "status"
    >,
  ) => {
    const newRequest: CoordinatorQuotaRequest = {
      ...request,
      id: `cqr-${Date.now()}`,
      requestedDate: new Date().toISOString(),
      status: "pending",
    };
    setCoordinatorQuotaRequests([
      ...coordinatorQuotaRequests,
      newRequest,
    ]);
    toast.success("Quota request submitted successfully");
  };

  const handleCoordinatorQuotaRequestUpdate = (
    id: string,
    updates: Partial<CoordinatorQuotaRequest>,
  ) => {
    setCoordinatorQuotaRequests((prev) =>
      prev.map((req) =>
        req.id === id ? { ...req, ...updates } : req,
      ),
    );
    toast.success("Quota request updated");
  };

  const handleCoordinatorQuotaRequestDelete = (id: string) => {
    setCoordinatorQuotaRequests((prev) =>
      prev.filter((req) => req.id !== id),
    );
    toast.success("Quota request deleted");
  };

  // Navigate from quota request to placement
  const handleNavigateToPlacementFromQuota = (
    request: CoordinatorQuotaRequest,
  ) => {
    // Create a new placement with metadata from the quota request
    const placement: StudentPlacement = {
      id: `placement-${Date.now()}`,
      title: "",
      year: "",
      semester: "",
      subject: request.emne || "",
      startDate: request.startDate,
      endDate: request.endDate,
      students: 50,
      status: "draft" as const,
      studyId: request.studyId,
      programId: request.programId,
    };
    setStudentPlacements([...studentPlacements, placement]);

    // Create empty placement task state for this new placement
    const newTaskState: PlacementTaskState = {
      placementId: placement.id,
      studentsImported: false,
      students: [],
      quotasSelected: false,
      quotas: [],
      firstPublished: false,
      studentsAssigned: false,
      documentsAttached: false,
      finalPublished: false,
      completedTasks: [],
    };
    setPlacementTaskStates([
      ...placementTaskStates,
      newTaskState,
    ]);

    // Set prefill data from quota request
    setQuotaRequestPrefillData({
      studyId: request.studyId,
      programId: request.programId,
      subject: request.emne || "",
      startDate: request.startDate,
      endDate: request.endDate,
    });

    // Navigate to the placement task view
    setSelectedStudentPlacement(placement);
    setCurrentView("placementtask");
  };

  // SK Person: Approve quota request
  const handleCoordinatorQuotaRequestApprove = (
    id: string,
    responseNotes?: string,
    selectedDepartmentId?: string,
    approvedCapacity?: number,
  ) => {
    setCoordinatorQuotaRequests((prev) =>
      prev.map((req) => {
        if (req.id === id) {
          // If department was selected during approval, update it
          const updatedReq = { ...req };
          if (selectedDepartmentId) {
            const praksisPlace = praksisPlaces.find(
              (p) => p.id === req.praksisPlaceId,
            );
            const selectedDept = praksisPlace?.departments.find(
              (d) => d.id === selectedDepartmentId,
            );
            if (selectedDept) {
              updatedReq.departmentId = selectedDept.id;
              updatedReq.departmentName = selectedDept.name;
            }
          }

          // Use the approved capacity if provided, otherwise use the requested capacity
          const finalCapacity =
            approvedCapacity !== undefined
              ? approvedCapacity
              : req.requestedCapacity;

          return {
            ...updatedReq,
            approvedCapacity: finalCapacity, // Set the approved capacity
            status: "approved" as const,
            approvedDate: new Date().toISOString(),
            approvedBy: "Sarah Contact", // SK person name (hardcoded for prototype)
            responseNotes,
          };
        }
        return req;
      }),
    );
    toast.success("Quota request approved successfully");
  };

  // SK Person: Reject quota request
  const handleCoordinatorQuotaRequestReject = (
    id: string,
    reason: string,
    responseNotes?: string,
  ) => {
    setCoordinatorQuotaRequests((prev) =>
      prev.map((req) =>
        req.id === id
          ? {
              ...req,
              status: "rejected" as const,
              rejectedDate: new Date().toISOString(),
              rejectedBy: "Sarah Contact", // SK person name (hardcoded for prototype)
              rejectionReason: reason,
              responseNotes,
            }
          : req,
      ),
    );
    toast.success("Quota request rejected");
  };

  // Reset to page 1 when filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedYear,
    selectedSemester,
    selectedSubject,
    selectedStatus,
    showCompleted,
    itemsPerPage,
  ]);

  const filteredStudentPlacements = studentPlacements.filter(
    (placement) => {
      // Get today's date for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

      // Parse placement end date
      const endDate = new Date(placement.endDate);
      endDate.setHours(0, 0, 0, 0);

      // Check if any filters are actively applied
      const hasActiveFilters =
        selectedYear !== "all" ||
        selectedSemester !== "all" ||
        selectedSubject !== "all" ||
        selectedStatus !== "all" ||
        searchTerm !== "";

      // Date filter logic:
      // - If showCompleted is true: show all placements (default)
      // - If any filter is actively applied: show all placements (user is searching for specific data)
      // - If no filters applied and showCompleted is false: only show ongoing placements
      const dateFilter =
        showCompleted || hasActiveFilters || endDate >= today;

      return (
        placement.title
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        (selectedYear === "all" ||
          placement.year === selectedYear) &&
        (selectedSemester === "all" ||
          placement.semester === selectedSemester) &&
        (selectedSubject === "all" ||
          placement.subject === selectedSubject) &&
        (selectedStatus === "all" ||
          placement.status === selectedStatus) &&
        dateFilter
      );
    },
  );

  const totalPages = Math.ceil(
    filteredStudentPlacements.length / itemsPerPage,
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPlacements = filteredStudentPlacements.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("spm_authenticated");
    localStorage.removeItem("spm_access_code");
    setIsAuthenticated(false);
    toast.info("Logged out successfully");
  };

  // Clear Local Data handler - clears all data except praksis places
  const handleClearData = () => {
    // Clear localStorage except authentication
    localStorage.removeItem("coordinatorQuotaRequests");

    // Reset all state to initial mock data except praksis places
    setStudentPlacements(mockStudentPlacements);
    setQuotaRequests(mockQuotaRequests);
    setPlacementTaskStates(mockPlacementTaskStates);
    setCoordinatorQuotaRequests(mockCoordinatorQuotaRequests);
    setQuotaOfferings(mockQuotaOfferings);

    // Reset view states
    setCurrentView("dashboard");
    setPraksisPlacesSubView("list");
    setSearchTerm("");
    setSelectedYear("all");
    setSelectedSemester("all");
    setSelectedSubject("all");
    setSelectedStatus("all");
    setShowCompleted(true);
    setViewMode("list");
    setCurrentPage(1);
    setSelectedStudentPlacement(null);
    setSelectedPraksisPlace(null);
    setIsDetailModalOpen(false);
    setIsPraksisPlaceModalOpen(false);
    setQuotaRequestPrefillData(null);

    toast.success("Local data cleared", {
      description:
        "All data except Praksis Places has been reset",
    });
  };

  // Generate Mock Placement with students for testing SK person view
  const generateMockPlacement = () => {
    if (praksisPlaces.length === 0) {
      toast.error("No Praksis Places Available", {
        description: "Please generate praksis places first",
      });
      return;
    }

    const firstPlace = praksisPlaces[0];
    const firstDepartment = firstPlace.departments[0];

    if (!firstDepartment) {
      toast.error("No Departments Available", {
        description:
          "The first praksis place has no departments",
      });
      return;
    }

    // Generate unique IDs
    const placementId = `placement-${Date.now()}`;
    const timestamp = Date.now();

    // Create 5 mock students
    const mockPlacementStudents = [
      {
        id: `student-${timestamp}-1`,
        name: "Emma Johnson",
        email: "emma.johnson@university.no",
        year: "3rd Year",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: firstPlace.id,
          placeName: firstPlace.name,
          departmentId: firstDepartment.id,
          departmentName: firstDepartment.name,
          placementTaskId: placementId,
          startDate: new Date(2024, 8, 1).toISOString(),
          endDate: new Date(2024, 11, 20).toISOString(),
          placementTitle: "Fall 2024 Medical Placement",
          assignedDate: new Date().toISOString(),
        },
      },
      {
        id: `student-${timestamp}-2`,
        name: "Oliver Anderson",
        email: "oliver.anderson@university.no",
        year: "3rd Year",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: firstPlace.id,
          placeName: firstPlace.name,
          departmentId: firstDepartment.id,
          departmentName: firstDepartment.name,
          placementTaskId: placementId,
          startDate: new Date(2024, 8, 1).toISOString(),
          endDate: new Date(2024, 11, 20).toISOString(),
          placementTitle: "Fall 2024 Medical Placement",
          assignedDate: new Date().toISOString(),
        },
      },
      {
        id: `student-${timestamp}-3`,
        name: "Sophia Martinez",
        email: "sophia.martinez@university.no",
        year: "3rd Year",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: firstPlace.id,
          placeName: firstPlace.name,
          departmentId: firstDepartment.id,
          departmentName: firstDepartment.name,
          placementTaskId: placementId,
          startDate: new Date(2024, 8, 1).toISOString(),
          endDate: new Date(2024, 11, 20).toISOString(),
          placementTitle: "Fall 2024 Medical Placement",
          assignedDate: new Date().toISOString(),
        },
      },
      {
        id: `student-${timestamp}-4`,
        name: "Lucas Brown",
        email: "lucas.brown@university.no",
        year: "3rd Year",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: firstPlace.id,
          placeName: firstPlace.name,
          departmentId: firstDepartment.id,
          departmentName: firstDepartment.name,
          placementTaskId: placementId,
          startDate: new Date(2024, 8, 1).toISOString(),
          endDate: new Date(2024, 11, 20).toISOString(),
          placementTitle: "Fall 2024 Medical Placement",
          assignedDate: new Date().toISOString(),
        },
      },
      {
        id: `student-${timestamp}-5`,
        name: "Ava Wilson",
        email: "ava.wilson@university.no",
        year: "3rd Year",
        customRequestSubmitted: false,
        assignedPraksisPlace: {
          placeId: firstPlace.id,
          placeName: firstPlace.name,
          departmentId: firstDepartment.id,
          departmentName: firstDepartment.name,
          placementTaskId: placementId,
          startDate: new Date(2024, 8, 1).toISOString(),
          endDate: new Date(2024, 11, 20).toISOString(),
          placementTitle: "Fall 2024 Medical Placement",
          assignedDate: new Date().toISOString(),
        },
      },
    ];

    // Create placement
    const newPlacement: StudentPlacement = {
      id: placementId,
      title: "Fall 2024 Medical Placement",
      year: "2024",
      semester: "Fall",
      subject: "Medicine",
      startDate: new Date(2024, 8, 1).toISOString(),
      endDate: new Date(2024, 11, 20).toISOString(),
      students: 5,
      status: "completed",
      studyId: "1",
      programId: "1-1",
    };

    // Create placement task state
    const newPlacementTaskState: PlacementTaskState = {
      placementId,
      studentsImported: true,
      students: mockPlacementStudents,
      quotasSelected: true,
      quotas: [
        {
          placeId: firstPlace.id,
          placeName: firstPlace.name,
          departmentId: firstDepartment.id,
          departmentName: firstDepartment.name,
          fixedQuota: 5,
          requestQuota: 0,
        },
      ],
      firstPublished: true,
      studentsAssigned: true,
      documentsAttached: true,
      finalPublished: true,
      completedTasks: ["1", "2", "3", "4", "5", "6", "7"],
    };

    // Create quota request
    const newQuotaRequest: QuotaRequest = {
      id: `quota-${timestamp}`,
      placementId,
      praksisPlaceId: firstPlace.id,
      praksisPlaceName: firstPlace.name,
      departmentId: firstDepartment.id,
      departmentName: firstDepartment.name,
      fixedQuota: 5,
      requestQuota: 0,
      studyProgram: "Medicine",
      studyYear: "3",
      placementTitle: "Fall 2024 Medical Placement",
      requestedBy: "John Coordinator",
      startDate: new Date(2024, 8, 1).toISOString(),
      endDate: new Date(2024, 11, 20).toISOString(),
      status: "approved",
      placementStatus: "completed",
      history: [
        {
          id: `history-${timestamp}`,
          timestamp: new Date().toISOString(),
          action: "created",
          performedBy: "System",
          performedByRole: "system",
          status: "approved",
          notes: "Mock placement generated for testing",
        },
      ],
    };

    // Update state
    setStudentPlacements([...studentPlacements, newPlacement]);
    setPlacementTaskStates([
      ...placementTaskStates,
      newPlacementTaskState,
    ]);
    setQuotaRequests([...quotaRequests, newQuotaRequest]);

    // Show success message
    toast.success("Mock Placement Generated", {
      description: `Created placement with 5 students assigned to ${firstPlace.name}`,
      duration: 4000,
    });
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <div className="bg-white flex flex-col h-screen">
      <Navbar
        onGenerateMockPlacement={generateMockPlacement}
        onLogout={handleLogout}
      />
      <div className="bg-white flex items-start justify-start w-full flex-1 overflow-hidden">
        {/* Show sidebar when not in AI sidebar view - Fixed position */}
        {!isAISidebarOpen && (
          <div className="hidden lg:block fixed left-0 top-[57px] bottom-0 z-40 w-60">
            <EnhancedSidebar
              currentView={currentView}
              onViewChange={(view) => {
                setCurrentView(view);
                // Progress onboarding if step 1 and clicking on placements
                if (
                  onboardingStep === 1 &&
                  view === "placements"
                ) {
                  setOnboardingStep(2);
                }
                // Reset praksis places sub-view when navigating away
                if (view !== "praksisplaces") {
                  setPraksisPlacesSubView("list");
                  setSelectedPraksisPlace(null);
                }
              }}
              onSettingsClick={() => setCurrentView("settings")}
              onAnalyticsClick={() =>
                setCurrentView("analytics")
              }
              onCommentsClick={() =>
                setCurrentView("onboarding-comments")
              }
              onClearData={handleClearData}
            />
          </div>
        )}
        {/* Main content area with margin for sidebar */}
        <div
          className={`flex-1 bg-white relative self-stretch overflow-auto flex justify-center ${
            !isAISidebarOpen
              ? "lg:ml-60"
              : ""
          }`}
        >
          {/* Centered content wrapper for extra-wide screens */}
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {/* PK Views */}
            {currentView === "placementtask" &&
            selectedStudentPlacement ? (
                  <PlacementTaskView
                    placement={selectedStudentPlacement}
                    praksisPlaces={praksisPlaces}
                    quotaRequests={quotaRequests}
                    allPlacementsData={placementTaskStates
                      .filter((ts) => ts.placementId !== selectedStudentPlacement.id)
                      .map((ts) => ({
                        placementId: ts.placementId,
                        placementTitle: studentPlacements.find((p) => p.id === ts.placementId)?.title ?? ts.placementId,
                        students: ts.students,
                      }))}
                    initialTaskState={placementTaskStates.find(
                      (ts) =>
                        ts.placementId ===
                        selectedStudentPlacement.id,
                    )}
                    onPlacementStatusUpdate={(
                      placementId,
                      status,
                    ) => {
                      setStudentPlacements((prev) =>
                        prev.map((p) =>
                          p.id === placementId
                            ? { ...p, status }
                            : p,
                        ),
                      );
                      // Update selectedStudentPlacement if it's the same placement
                      if (
                        selectedStudentPlacement.id ===
                        placementId
                      ) {
                        setSelectedStudentPlacement((prev) =>
                          prev ? { ...prev, status } : prev,
                        );
                      }
                      // Update quotaRequest.placementStatus when placement status changes to "publish" or "completed"
                      if (
                        status === "publish" ||
                        status === "completed"
                      ) {
                        setQuotaRequests((prev) =>
                          prev.map((req) =>
                            req.placementId === placementId
                              ? {
                                  ...req,
                                  placementStatus: status,
                                }
                              : req,
                          ),
                        );
                      }
                    }}
                    onPlacementMetadataUpdate={
                      handlePlacementMetadataUpdate
                    }
                    onPlacementDelete={(placementId) => {
                      setStudentPlacements((prev) =>
                        prev.filter(
                          (p) => p.id !== placementId,
                        ),
                      );
                      setPlacementTaskStates((prev) =>
                        prev.filter(
                          (ts) =>
                            ts.placementId !== placementId,
                        ),
                      );
                      setSelectedStudentPlacement(null);
                    }}
                    onTaskStateUpdate={(updatedState) => {
                      setPlacementTaskStates((prev) =>
                        prev.map((ts) =>
                          ts.placementId ===
                          selectedStudentPlacement.id
                            ? updatedState
                            : ts,
                        ),
                      );
                      // Also update the student count in the placement
                      setStudentPlacements((prev) =>
                        prev.map((p) =>
                          p.id === selectedStudentPlacement.id
                            ? {
                                ...p,
                                students:
                                  updatedState.students.length,
                              }
                            : p,
                        ),
                      );
                    }}
                    onBack={() => {
                      setCurrentView("placements");
                      setQuotaRequestPrefillData(null);
                    }}
                    isAISidebarOpen={isAISidebarOpen}
                    onAISidebarChange={setIsAISidebarOpen}
                    onboardingStep={onboardingStep}
                    onboardingData={onboardingData}
                    setOnboardingStep={setOnboardingStep}
                    onQuotaRequestCreate={(requests) =>
                      setQuotaRequests((prev) => {
                        const updatedRequests = [...prev];

                        requests.forEach((newReq: any) => {
                          // Find existing quota request for same placement/place/department (no assignmentType check)
                          const existingIndex =
                            updatedRequests.findIndex(
                              (qr) =>
                                qr.placementId ===
                                  newReq.placementId &&
                                qr.praksisPlaceId ===
                                  newReq.praksisPlaceId &&
                                qr.departmentId ===
                                  newReq.departmentId,
                            );

                          if (existingIndex >= 0) {
                            // Replace existing request with the new one
                            // The new request already has proper history from handleSaveQuotas
                            updatedRequests[existingIndex] =
                              newReq;
                          } else {
                            // Add new request
                            updatedRequests.push(newReq);
                          }
                        });

                        return updatedRequests;
                      })
                    }
                    studies={studies}
                    coordinatorQuotaRequests={
                      coordinatorQuotaRequests
                    }
                    onCoordinatorQuotaRequestCreate={
                      handleCoordinatorQuotaRequestCreate
                    }
                    onCoordinatorQuotaRequestUpdate={
                      handleCoordinatorQuotaRequestUpdate
                    }
                    currentUserName="John Coordinator"
                    prefillData={
                      quotaRequestPrefillData || undefined
                    }
                  />
                ) : (
                  <div className="flex flex-col gap-5 items-center justify-start h-full w-full">
                    {currentView === "dashboard" ? (
                      <Dashboard
                        placements={studentPlacements}
                        placementTaskStates={
                          placementTaskStates
                        }
                        praksisPlaces={praksisPlaces}
                        studies={studies}
                        coordinatorQuotaRequests={
                          coordinatorQuotaRequests
                        }
                        onPlacementClick={
                          handleStudentPlacementClick
                        }
                        onPraksisPlaceClick={(place) => {
                          setSelectedPraksisPlace(place);
                          setPraksisPlacesSubView("detail");
                          setCurrentView("praksisplaces");
                        }}
                        onViewAllClick={() =>
                          setCurrentView("placements")
                        }
                        onViewAllPraksisPlacesClick={() =>
                          setCurrentView("praksisplaces")
                        }
                        onViewAllQuotaRequestsClick={() =>
                          setCurrentView("quotas")
                        }
                        onQuotaRequestNavigate={
                          handleNavigateToPlacementFromQuota
                        }
                        onStartOnboarding={() =>
                          setOnboardingStep(1)
                        }
                        dashboardSettings={dashboardSettings}
                      />
                    ) : currentView === "settings" ? (
                      <SettingsView
                        dashboardSettings={dashboardSettings}
                        onSave={(settings) => {
                          setDashboardSettings(settings);
                          // Optionally show a success message
                        }}
                      />
                    ) : currentView === "analytics" ? (
                      <AnalyticsAI />
                    ) : currentView ===
                      "onboarding-comments" ? (
                      (() => {
                        const accessCode =
                          typeof window !== "undefined"
                            ? localStorage.getItem(
                                "spm_access_code",
                              )
                            : null;
                        return accessCode === "E8W6B4C3" ? (
                          <OnboardingCommentsView />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center p-8">
                              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                Access Restricted
                              </h2>
                              <p className="text-gray-600">
                                You do not have access to this
                                page.
                              </p>
                            </div>
                          </div>
                        );
                      })()
                    ) : currentView === "quotas" ? (
                      <CoordinatorQuotasView
                        quotaOfferings={quotaOfferings}
                        quotaRequests={coordinatorQuotaRequests}
                        praksisPlaces={praksisPlaces}
                        studies={studies}
                        currentUserName="John Coordinator"
                        placementTaskStates={
                          placementTaskStates
                        }
                        onRequestCreate={
                          handleCoordinatorQuotaRequestCreate
                        }
                        onRequestUpdate={
                          handleCoordinatorQuotaRequestUpdate
                        }
                        onRequestDelete={
                          handleCoordinatorQuotaRequestDelete
                        }
                        onNavigateToPlacement={
                          handleNavigateToPlacementFromQuota
                        }
                      />
                    ) : currentView === "praksisplaces" ? (
                      <>
                        {praksisPlacesSubView === "list" && (
                          <PraksisPlacesView
                            places={praksisPlaces}
                            onPlaceClick={
                              handlePraksisPlaceClick
                            }
                            onCreatePlace={
                              handleCreatePraksisPlace
                            }
                            onPlacesUpdate={
                              handlePraksisPlacesUpdate
                            }
                          />
                        )}
                        {praksisPlacesSubView === "detail" &&
                          selectedPraksisPlace && (
                            <PraksisPlaceDetailView
                              place={selectedPraksisPlace}
                              onUpdate={
                                handlePraksisPlaceUpdate
                              }
                              onBack={
                                handleBackToPraksisPlacesList
                              }
                            />
                          )}
                        {praksisPlacesSubView === "create" && (
                          <CreatePraksisPlaceView
                            onBack={
                              handleBackToPraksisPlacesList
                            }
                            onCreate={
                              handleCreatePraksisPlaceSubmit
                            }
                          />
                        )}
                      </>
                    ) : (
                      <>
                        {/* Page Title */}
                        <div className="flex items-center justify-between w-full">
                          <h1 className="font-bold text-gray-700 text-2xl">
                            Student placement
                          </h1>
                        </div>

                        {/* Filters and View Controls */}
                        <div className="flex items-center justify-between w-full gap-4">
                          <div className="flex gap-2 items-center">
                            <FilterModal
                              searchTerm={searchTerm}
                              selectedYear={selectedYear}
                              selectedSemester={
                                selectedSemester
                              }
                              selectedSubject={selectedSubject}
                              selectedStatus={selectedStatus}
                              showCompleted={showCompleted}
                              onSearchChange={setSearchTerm}
                              onYearChange={setSelectedYear}
                              onSemesterChange={
                                setSelectedSemester
                              }
                              onSubjectChange={
                                setSelectedSubject
                              }
                              onStatusChange={setSelectedStatus}
                              onShowCompletedChange={
                                setShowCompleted
                              }
                              onClearAll={() => {
                                setSearchTerm("");
                                setSelectedYear("all");
                                setSelectedSemester("all");
                                setSelectedSubject("all");
                                setSelectedStatus("all");
                                setShowCompleted(true);
                              }}
                            />

                            <div className="flex gap-1 items-center ml-4">
                              <span className="text-gray-600 text-xs mr-2">
                                View by
                              </span>
                              <Button
                                variant={
                                  viewMode === "gantt"
                                    ? "default"
                                    : "ghost"
                                }
                                size="sm"
                                onClick={() =>
                                  setViewMode("gantt")
                                }
                                className="p-2 h-8 w-8"
                              >
                                <Grid3X3 className="h-5 w-5" />
                              </Button>
                              <Button
                                variant={
                                  viewMode === "list"
                                    ? "default"
                                    : "ghost"
                                }
                                size="sm"
                                onClick={() =>
                                  setViewMode("list")
                                }
                                className="p-2 h-8 w-8"
                              >
                                <List className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>

                          <div className="flex gap-2 items-center">
                            <CreatePlacementButton
                              onCreatePlacement={
                                handleCreatePlacement
                              }
                              onboardingStep={onboardingStep}
                              onboardingData={onboardingData}
                              setOnboardingStep={
                                setOnboardingStep
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setIsPlacementHelpOpen(true)}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                            >
                              <HelpCircle className="h-4 w-4" />
                              <span className="font-medium">
                                Help
                              </span>
                            </Button>
                          </div>
                        </div>

                        {/* Active Filter Chips */}
                        {(searchTerm !== "" ||
                          selectedYear !== "all" ||
                          selectedSemester !== "all" ||
                          selectedSubject !== "all" ||
                          selectedStatus !== "all") && (
                          <div className="flex flex-wrap gap-2 items-center w-full">
                            <FilterChips
                              searchTerm={searchTerm}
                              selectedYear={selectedYear}
                              selectedSemester={
                                selectedSemester
                              }
                              selectedSubject={selectedSubject}
                              selectedStatus={selectedStatus}
                              onSearchChange={setSearchTerm}
                              onYearChange={setSelectedYear}
                              onSemesterChange={
                                setSelectedSemester
                              }
                              onSubjectChange={
                                setSelectedSubject
                              }
                              onStatusChange={setSelectedStatus}
                            />
                          </div>
                        )}

                        {/* Content View */}
                        <div className="w-full">
                          {viewMode === "gantt" ? (
                            <GanttView
                              placements={
                                filteredStudentPlacements
                              }
                              onPlacementClick={
                                handleStudentPlacementClick
                              }
                            />
                          ) : (
                            <TableView
                              placements={paginatedPlacements}
                              placementTaskStates={
                                placementTaskStates
                              }
                              studies={studies}
                              onPlacementClick={
                                handleStudentPlacementClick
                              }
                            />
                          )}
                        </div>

                        {/* Pagination - Only show for table view */}
                        {viewMode === "list" && (
                          <div className="flex items-center justify-between w-full mt-4">
                            <div className="flex items-center gap-4">
                              <span className="text-gray-500 text-xs">
                                {
                                  filteredStudentPlacements.length
                                }{" "}
                                items
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-gray-500 text-xs">
                                  Rows per page:
                                </span>
                                <Select
                                  value={itemsPerPage.toString()}
                                  onValueChange={(value) =>
                                    setItemsPerPage(
                                      Number(value),
                                    )
                                  }
                                >
                                  <SelectTrigger className="w-16 h-10">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="10">
                                      10
                                    </SelectItem>
                                    <SelectItem value="30">
                                      30
                                    </SelectItem>
                                    <SelectItem value="50">
                                      50
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage(
                                      Math.max(
                                        1,
                                        currentPage - 1,
                                      ),
                                    )
                                  }
                                  disabled={currentPage === 1}
                                  className="h-7 w-7 p-0"
                                >
                                  <ChevronLeft className="h-3.5 w-3.5" />
                                </Button>
                                <span className="font-bold text-blue-600 text-xs">
                                  {currentPage}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  /
                                </span>
                                <span className="text-gray-600 text-xs">
                                  {totalPages}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setCurrentPage(
                                      Math.min(
                                        totalPages,
                                        currentPage + 1,
                                      ),
                                    )
                                  }
                                  disabled={
                                    currentPage === totalPages
                                  }
                                  className="h-7 w-7 p-0"
                                >
                                  <ChevronRight className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-gray-600 text-sm">
                                  Go to
                                </span>
                                <Input
                                  type="number"
                                  min="1"
                                  max={totalPages}
                                  value={currentPage}
                                  onChange={(e) =>
                                    setCurrentPage(
                                      Math.max(
                                        1,
                                        Math.min(
                                          totalPages,
                                          Number(
                                            e.target.value,
                                          ),
                                        ),
                                      ),
                                    )
                                  }
                                  className="w-14 h-8 text-xs"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 px-3 text-blue-600"
                                >
                                  Go
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
          </div>
        </div>
      </div>

      {/* Praksis Place Detail Modal */}
      <PraksisPlaceDetailModal
        place={selectedPraksisPlace}
        isOpen={isPraksisPlaceModalOpen}
        onClose={() => setIsPraksisPlaceModalOpen(false)}
        onUpdate={handlePraksisPlaceUpdate}
      />

      {/* Add Department Member Modal */}
      <AddDepartmentMemberModal
        isOpen={showAddDepartmentModal}
        onClose={() => setShowAddDepartmentModal(false)}
        praksisPlaceName={newlyCreatedPlace?.name || ""}
        onSave={(departments) => {
          if (newlyCreatedPlace) {
            // Generate IDs for new departments
            const departmentsWithIds: Department[] =
              departments.map((dept, index) => ({
                ...dept,
                id: `dept-${newlyCreatedPlace.id}-${Date.now()}-${index}`,
              }));

            const updatedPlace: PraksisPlace = {
              ...newlyCreatedPlace,
              departments: departmentsWithIds,
              totalCapacity: departmentsWithIds.reduce(
                (sum, dept) => sum + dept.capacity,
                0,
              ),
            };

            // Update the place in the list
            setPraksisPlaces((prev) =>
              prev.map((p) =>
                p.id === updatedPlace.id ? updatedPlace : p,
              ),
            );

            // Update selected place
            setSelectedPraksisPlace(updatedPlace);
          }

          setShowAddDepartmentModal(false);
        }}
      />

      {/* Onboarding Overlay System - Cutout Approach */}
      {onboardingStep > 0 && (
        <>
          {/* Step 1: Highlight Student Placements sidebar item */}
          {onboardingStep === 1 && (
            <div className="fixed inset-0 z-[10000] pointer-events-none">
              {/* Four overlays surrounding the cutout area */}
              {/* Top overlay */}
              <div
                className="absolute top-0 left-0 right-0 bg-black/70 pointer-events-auto"
                style={{ height: "110px" }}
              />
              {/* Left overlay */}
              <div
                className="absolute bg-black/70 pointer-events-auto"
                style={{
                  top: "110px",
                  left: 0,
                  width: "11px",
                  height: "32px",
                }}
              />
              {/* Right overlay */}
              <div
                className="absolute bg-black/70 pointer-events-auto"
                style={{
                  top: "110px",
                  left: "219px",
                  right: 0,
                  height: "32px",
                }}
              />
              {/* Bottom overlay */}
              <div
                className="absolute left-0 right-0 bottom-0 bg-black/70 pointer-events-auto"
                style={{ top: "142px" }}
              />

              {/* Blue glowing border around cutout */}
              <div
                className="absolute border-2 border-blue-500 rounded-md pointer-events-none"
                style={{
                  left: "11px",
                  top: "110px",
                  width: "208px",
                  height: "32px",
                }}
              />

              {/* Instructional tooltip */}
              <div
                className="absolute bg-white p-4 rounded-lg shadow-2xl pointer-events-auto"
                style={{
                  left: "260px",
                  top: "105px",
                  width: "280px",
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-1">
                      Navigate to Student Placements
                    </h3>
                    <p className="text-sm text-gray-600">
                      Click on "Student placement" in the
                      sidebar to continue.
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-xs text-gray-500">
                    Step 1 of 3
                  </span>
                  <button
                    onClick={() => setOnboardingStep(0)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Skip tutorial
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Highlight Create New Student Placement button */}
          {onboardingStep === 2 &&
            currentView === "placements" && (
              <div className="fixed inset-0 z-[10000] pointer-events-none">
                {/* Four overlays surrounding the cutout area */}
                {/* Top overlay */}
                <div
                  className="absolute top-0 left-0 right-0 bg-black/70 pointer-events-auto"
                  style={{ height: "131px" }}
                />
                {/* Left overlay - from top of cutout to bottom of cutout */}
                <div
                  className="absolute bg-black/70 pointer-events-auto"
                  style={{
                    top: "131px",
                    left: 0,
                    right:
                      "calc(max((100vw - 1600px) / 2 + 40px, 40px) - 30px + 270px)",
                    height: "40px",
                  }}
                />
                {/* Right overlay - from button to right edge */}
                <div
                  className="absolute bg-black/70 pointer-events-auto"
                  style={{
                    top: "131px",
                    right:
                      "calc(max((100vw - 1600px) / 2 + 40px, 40px) - 30px)",
                    width:
                      "calc(max((100vw - 1600px) / 2 + 40px, 40px) - 30px)",
                    height: "40px",
                  }}
                />
                {/* Bottom overlay */}
                <div
                  className="absolute left-0 right-0 bottom-0 bg-black/70 pointer-events-auto"
                  style={{ top: "171px" }}
                />

                {/* Blue glowing border around cutout */}
                <div
                  className="absolute border-2 border-blue-500 rounded-md pointer-events-none"
                  style={{
                    top: "131px",
                    right:
                      "calc(max((100vw - 1600px) / 2 + 40px, 40px) - 30px)",
                    width: "270px",
                    height: "40px",
                  }}
                />

                {/* Instructional tooltip */}
                <div
                  className="absolute bg-white p-4 rounded-lg shadow-2xl pointer-events-auto"
                  style={{
                    top: "185px",
                    right:
                      "calc(max((100vw - 1600px) / 2 + 40px, 40px) - 30px)",
                    width: "300px",
                  }}
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        Create a New Placement
                      </h3>
                      <p className="text-sm text-gray-600">
                        Click the "Create new student placement"
                        button to open the form.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span className="text-xs text-gray-500">
                      Step 2 of 3
                    </span>
                    <button
                      onClick={() => setOnboardingStep(0)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Skip tutorial
                    </button>
                  </div>
                </div>
              </div>
            )}

          {/* Step 3: Dialog open with instructions */}
          {onboardingStep === 3 && (
            <div className="fixed inset-0 z-[9997]">
              {/* Blur overlay behind dialog */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              {/* Instructional tooltip - positioned near dialog */}
              <div
                className="absolute bg-blue-600 text-white p-4 rounded-lg shadow-2xl"
                style={{
                  top: "80px",
                  right: "60px",
                  width: "320px",
                  zIndex: 10001,
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">
                      Review and Complete
                    </h3>
                    <p className="text-sm opacity-90">
                      The form has been filled with sample data.
                      Review it and click "Create" to complete
                      the tutorial.
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/20">
                  <span className="text-xs opacity-75">
                    Step 3 of 3 - Final Step
                  </span>
                  <button
                    onClick={() => setOnboardingStep(0)}
                    className="text-xs hover:underline font-medium"
                  >
                    Skip tutorial
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Floating Onboarding Button - Only for PK role, hidden on analytics and settings */}
      <FloatingOnboardingButton
        onClick={() => {
          const step = getOnboardingStepForView(currentView);
          setInitialOnboardingStep(step);
          setIsOnboardingOpen(true);
        }}
        show={
          currentView !== "analytics" &&
          currentView !== "settings"
        }
      />

      {/* Onboarding Overlay */}
      <OnboardingOverlay
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentView={currentView}
        initialStep={initialOnboardingStep}
      />

      {/* Placement Task Help Overlay */}
      <PlacementTaskHelpOverlay
        isOpen={isPlacementHelpOpen}
        onClose={() => setIsPlacementHelpOpen(false)}
      />

      <Toaster />
    </div>
  );
}