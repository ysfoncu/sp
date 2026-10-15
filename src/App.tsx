import React, { useState, useEffect, useMemo } from "react";
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
  CheckCircle,
  Building2,
  Trash2,
  HelpCircle,
} from "lucide-react";
import { EnhancedSidebar } from "./components/EnhancedSidebar";
import { PlacementFilterBar } from "./components/PlacementFilterBar";
import {
  PeriodOption,
  getSemesterRanges,
  matchesPeriod,
} from "./components/periodFilter";
import { GanttView } from "./components/GanttView";
import { TableView } from "./components/TableView";
import { StudentsView } from "./components/StudentsView";
import { PlacementReportView } from "./components/PlacementReportView";
import { CapacityPlanningReportView } from "./components/CapacityPlanningReportView";
import { InvoiceReportView } from "./components/InvoiceReportView";
import { Dashboard } from "./components/Dashboard";
import { PraksisPlacesView } from "./components/PraksisPlacesView";
import { CreatePraksisPlaceView } from "./components/CreatePraksisPlaceView";
import { UnderConstruction } from "./components/UnderConstruction";
import { AnalyticsAI } from "./components/AnalyticsAI";
import { PlacementTaskView } from "./components/PlacementTaskView";
import { LoginScreen } from "./components/LoginScreen";
import { Study, StudyProgram, useStudyCatalog } from "./types/studyCatalog";
import { enrolledFromPraksis } from "./types/enrolledFromPraksis";
import { PraksisStudentsView } from "./components/PraksisStudentsView";
import { LeaveDialog } from "./components/LeaveDialog";
import { goView, installHistory } from "./navigation";
import { parsePlacesHash } from "./types/placesRoute";
import {
  StudentFilters,
  clearPraksisStudents,
  deriveRows,
  placementHistoryOf,
  pruneClaims,
  releasePlacement,
  usePraksisStudents,
} from "./types/praksisStudent";
import { ProfileUsageProvider } from "./components/ProfileUsageContext";
import { findEmne, findProgram } from "./types/studyCatalog";
import { usePlacementProfiles } from "./types/placementProfile";
import { OtherPlacementUsage } from "./types/profileUsage";
import { SettingsView, DashboardSettings } from "./components/SettingsView";
import { toast } from "sonner@2.0.3";
import { Toaster } from "./components/ui/sonner";
import {
  mockPraksisPlaces,
  PraksisPlace,
} from "./types/praksisPlace";
import { PrioritiesView } from "./components/PrioritiesView";
import { PriorityItemDetailView } from "./components/PriorityItemDetailView";
import {
  mockEnrolledStudents,
  mockPriorityPeriods,
  mockPriorityApplications,
  EnrolledStudent,
  PriorityPlacementPeriod,
  PriorityPlacementApplication,
} from "./types/priorityPlacement";
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

  // Dashboard Settings State - controls which dashboard sections are visible
  const [dashboardSettings, setDashboardSettings] =
    useState<DashboardSettings>({
      praksisPlacesOverview: false,
      placementOverview: true,
      tasks: true,
      recentActivities: true,
      placementProgress: true,
      yearlyPlacements: true,
    });

  // Studies, programs and emner come from the shared catalog (Settings edits it; archived items left out)
  const { active: studies } = useStudyCatalog();
  const allProfiles = usePlacementProfiles();


  // Priority placement state
  const [priorityPeriods, setPriorityPeriods] = useState<PriorityPlacementPeriod[]>(mockPriorityPeriods);
  const [priorityApplications, setPriorityApplications] = useState<PriorityPlacementApplication[]>(mockPriorityApplications);
  // The students of the priority part are the ones in Praksis-students
  const { students: praksisStudentList } = usePraksisStudents();
  const enrolledStudents = useMemo<EnrolledStudent[]>(() => enrolledFromPraksis(praksisStudentList, studies), [praksisStudentList, studies]);
  const [selectedPriorityPeriod, setSelectedPriorityPeriod] = useState<PriorityPlacementPeriod | null>(null);

  const [currentView, setCurrentView] = useState<
    | "dashboard"
    | "placements"
    | "praksisplaces"
    | "praksisstudents"
    | "priorities"
    | "priorityitem"
    | "students"
    | "placementreport"
    | "capacityreport"
    | "invoicereport"
    | "settings"
    | "analytics"
    | "placementtask"
    | "onboarding-comments"
  >(() => (parsePlacesHash(window.location.hash) ? "praksisplaces" : "dashboard")); // a places link opens the places page

  // Back, Forward and the unsaved-edit guard for the places page (see navigation.ts)
  useEffect(() => installHistory(currentView, setCurrentView), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Praksis Places Sub-view State
  // The status chip the Praksis-students page opens with when a dashboard tile led there
  const [studentsInitialStatus, setStudentsInitialStatus] = useState<StudentFilters["status"]>();
  const [praksisPlacesSubView, setPraksisPlacesSubView] =
    useState<"list" | "create">("list");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudy, setSelectedStudy] = useState("all");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  // Period filter — always applied; defaults to this + next semester
  const [selectedPeriods, setSelectedPeriods] = useState<Set<PeriodOption>>(
    new Set<PeriodOption>(["current", "next"]),
  );
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "gantt">(
    "list",
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(30);
  const [
    selectedStudentPlacement,
    setSelectedStudentPlacement,
  ] = useState<StudentPlacement | null>(null);
  // Set when an entity is opened from a placement: Praksis places then shows it (and edits it)
  const [selectedPraksisPlace, setSelectedPraksisPlace] =
    useState<PraksisPlace | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] =
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
  // The tour opens at the step of the page being viewed (the ids are those of onboardingSteps)
  const getOnboardingStepForView = (view: string): number => {
    switch (view) {
      case "dashboard":
        return 2;
      case "praksisstudents":
        return 3;
      case "placements":
      case "placementtask":
        return 4;
      case "praksisplaces":
        return 5;
      case "priorities":
      case "priorityitem":
        return 6;
      case "placementreport":
      case "capacityreport":
      case "invoicereport":
        return 7;
      case "settings":
        return 8;
      default:
        return 1; // Welcome screen for other pages
    }
  };

  const handleCreatePlacement = () => {
    // Create a draft placement with empty fields
    const placement: StudentPlacement = {
      id: `pl-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`,
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
      emneId?: string;
      location?: string;
      totalPraksisHours?: number;
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
    setPraksisPlacesSubView("list");
  };

  const handleBackToPraksisPlacesList = () => {
    setPraksisPlacesSubView("list");
    setSelectedPraksisPlace(null);
  };

  // Reset to page 1 when filters or items per page change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    selectedStudy,
    selectedProgram,
    selectedSubject,
    selectedStatus,
    selectedPeriods,
    customStartDate,
    customEndDate,
    itemsPerPage,
  ]);

  const semesterRanges = useMemo(() => getSemesterRanges(new Date()), []);

  // Distinct emne values derived from the placements
  const placementSubjects = useMemo(
    () => [...new Set(studentPlacements.map((p) => p.subject).filter(Boolean))].sort(),
    [studentPlacements],
  );

  const filteredStudentPlacements = studentPlacements.filter((placement) => {
    return (
      placement.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedStudy === "all" || placement.studyId === selectedStudy) &&
      (selectedProgram === "all" || placement.programId === selectedProgram) &&
      (selectedSubject === "all" || placement.subject === selectedSubject) &&
      (selectedStatus === "all" || placement.status === selectedStatus) &&
      // Period filter is always applied — only placements that fall into the
      // selected period(s) are shown.
      matchesPeriod(
        placement.startDate,
        placement.endDate,
        selectedPeriods,
        customStartDate,
        customEndDate,
        semesterRanges,
      )
    );
  });

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

  // Priority placement handlers
  const handlePriorityPeriodCreate = (
    period: Omit<PriorityPlacementPeriod, "id" | "createdDate" | "createdBy" | "eligibleStudentIds">
  ) => {
    // A period made for an emne takes the Praksis-students of that emne (at its locations); an older period by term
    const eligibleStudentIds = enrolledStudents
      .filter(
        (s) =>
          (period.studyLocations.length === 0 || period.studyLocations.includes(s.studyLocation)) &&
          period.programIds.includes(s.programId) &&
          (period.emneIds && period.emneIds.length > 0 ? !!s.emneId && period.emneIds.includes(s.emneId) : period.admissionTerms.includes(s.admissionTerm))
      )
      .map((s) => s.id);

    const created: PriorityPlacementPeriod = {
      ...period,
      id: `pp-${Date.now()}`,
      createdDate: new Date().toISOString().split("T")[0],
      createdBy: "John Coordinator",
      eligibleStudentIds,
      importedStudentIds: period.importedStudentIds ?? [],
      // First notice is now configured at creation; treat the noticing date as when it is sent.
      firstNoticeSentAt: period.firstNoticeDate,
    };
    setPriorityPeriods((prev) => [...prev, created]);
    // Right after creating, show the details of the new priority list (not the list of lists)
    setSelectedPriorityPeriod(created);
    setCurrentView("priorityitem");
    toast.success("Application period created");
  };

  const handlePriorityPeriodToggleStatus = (id: string) => {
    setPriorityPeriods((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: p.status === "open" ? "closed" : "open" } : p))
    );
  };

  const handlePriorityPeriodUpdateDate = (
    periodId: string,
    field: "firstNoticeDate" | "firstNoticeDeadline",
    date: string
  ) => {
    const apply = (p: PriorityPlacementPeriod): PriorityPlacementPeriod => {
      const updated: PriorityPlacementPeriod = { ...p, [field]: date };
      // Setting the noticing date also marks the first notice as sent on that date,
      // mirroring how periods created with a noticing date behave.
      if (field === "firstNoticeDate") updated.firstNoticeSentAt = date;
      return updated;
    };
    setPriorityPeriods((prev) => prev.map((p) => (p.id === periodId ? apply(p) : p)));
    setSelectedPriorityPeriod((prev) =>
      prev && prev.id === periodId ? apply(prev) : prev
    );
  };

  const handlePriorityApplicationApprove = (id: string, notes?: string) => {
    setPriorityApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "approved" as const,
              decidedBy: "John Coordinator",
              decidedDate: new Date().toISOString().split("T")[0],
              decisionNotes: notes,
            }
          : a
      )
    );
    toast.success("Ansökan godkänd");
  };

  const handlePriorityApplicationReject = (id: string, notes: string) => {
    setPriorityApplications((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              status: "rejected" as const,
              decidedBy: "John Coordinator",
              decidedDate: new Date().toISOString().split("T")[0],
              decisionNotes: notes,
            }
          : a
      )
    );
    toast.info("Ansökan avslagen");
  };

  const handleManualGrantPriority = (
    application: Omit<PriorityPlacementApplication, "id" | "submittedDate">
  ) => {
    setPriorityApplications((prev) => [
      ...prev,
      {
        ...application,
        id: `pa-${Date.now()}`,
        submittedDate: new Date().toISOString().split("T")[0],
        published: false,
      },
    ]);
    toast.success("Prioritet beviljad manuellt");
  };

  const handlePriorityItemImportStudents = (periodId: string) => {
    const first5 = mockEnrolledStudents.slice(0, 5);
    const period = priorityPeriods.find((p) => p.id === periodId);
    if (!period) return;
    setPriorityPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId ? { ...p, importedStudentIds: first5.map((s) => s.id) } : p
      )
    );
    const newApps: PriorityPlacementApplication[] = first5.map((s) => ({
      id: `pa-${Date.now()}-${s.id}`,
      periodId,
      studentId: s.id,
      studentName: s.name,
      personnummer: s.personnummer,
      programId: s.programId,
      programName: s.programName,
      studyId: s.studyId,
      studyName: s.studyName,
      studyLocation: s.studyLocation,
      admissionTerm: s.admissionTerm,
      targetSemester: `${period.semester}-${period.year}`,
      selectedReasons: [],
      totalPoints: 0,
      hasDriversLicense: s.hasDriversLicense,
      submittedDate: new Date().toISOString().split("T")[0],
      status: "pending" as const,
      isManualGrant: false,
      published: false,
      noticeSentAt: period.firstNoticeSentAt ?? period.firstNoticeDate,
    }));
    setPriorityApplications((prev) => [...prev, ...newApps]);
    toast.success(`${first5.length} students imported`);
  };

  const handleSendFirstNotice = (periodId: string, deadline: string, message: string) => {
    const sentAt = new Date().toISOString().split("T")[0];
    setPriorityPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? { ...p, firstNoticeSentAt: sentAt, firstNoticeDeadline: deadline, firstNoticeMessage: message }
          : p
      )
    );
    setPriorityApplications((prev) =>
      prev.map((a) => (a.periodId === periodId ? { ...a, noticeSentAt: sentAt } : a))
    );
    setSelectedPriorityPeriod((prev) =>
      prev && prev.id === periodId
        ? { ...prev, firstNoticeSentAt: sentAt, firstNoticeDeadline: deadline }
        : prev
    );
    toast.success("First notice sent to students");
  };

  const handleAddStudentsToPeriod = (periodId: string, studentIds: string[]) => {
    const period = priorityPeriods.find((p) => p.id === periodId);
    if (!period) return;
    const students = mockEnrolledStudents.filter((s) => studentIds.includes(s.id));
    setPriorityPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? { ...p, importedStudentIds: [...p.importedStudentIds, ...studentIds] }
          : p
      )
    );
    setSelectedPriorityPeriod((prev) =>
      prev && prev.id === periodId
        ? { ...prev, importedStudentIds: [...prev.importedStudentIds, ...studentIds] }
        : prev
    );
    const newApps: PriorityPlacementApplication[] = students.map((s) => ({
      id: `pa-${Date.now()}-${s.id}`,
      periodId,
      studentId: s.id,
      studentName: s.name,
      personnummer: s.personnummer,
      programId: s.programId,
      programName: s.programName,
      studyId: s.studyId,
      studyName: s.studyName,
      studyLocation: s.studyLocation,
      admissionTerm: s.admissionTerm,
      targetSemester: `${period.semester}-${period.year}`,
      selectedReasons: [],
      totalPoints: 0,
      hasDriversLicense: s.hasDriversLicense,
      submittedDate: new Date().toISOString().split("T")[0],
      status: "pending" as const,
      isManualGrant: false,
      published: false,
      noticeSentAt: period.firstNoticeSentAt ?? period.firstNoticeDate,
    }));
    setPriorityApplications((prev) => [...prev, ...newApps]);
    toast.success(`${students.length} student${students.length > 1 ? "s" : ""} added`);
  };

  const handleSendIndividualNotice = (periodId: string, studentId: string) => {
    const sentAt = new Date().toISOString().split("T")[0];
    setPriorityApplications((prev) =>
      prev.map((a) =>
        a.periodId === periodId && a.studentId === studentId
          ? { ...a, noticeSentAt: sentAt }
          : a
      )
    );
    toast.success("Notice sent to student");
  };

  const handlePublishResults = (periodId: string) => {
    const publishedAt = new Date().toISOString().split("T")[0];
    setPriorityPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? { ...p, resultPublishedAt: publishedAt, status: "closed" }
          : p
      )
    );
    setPriorityApplications((prev) =>
      prev.map((a) => (a.periodId === periodId ? { ...a, published: true } : a))
    );
    setSelectedPriorityPeriod((prev) =>
      prev && prev.id === periodId
        ? { ...prev, resultPublishedAt: publishedAt, status: "closed" }
        : prev
    );
    toast.success("Decisions published");
  };

  const handleDeletePeriod = (periodId: string) => {
    setPriorityPeriods((prev) => prev.filter((p) => p.id !== periodId));
    setPriorityApplications((prev) => prev.filter((a) => a.periodId !== periodId));
    toast.success("Priority period deleted");
  };

  const handleReopenPriority = (periodId: string) => {
    setPriorityPeriods((prev) =>
      prev.map((p) =>
        p.id === periodId
          ? { ...p, status: "open", resultPublishedAt: undefined }
          : p
      )
    );
    setSelectedPriorityPeriod((prev) =>
      prev && prev.id === periodId
        ? { ...prev, status: "open", resultPublishedAt: undefined }
        : prev
    );
    toast.success("Priority period reopened");
  };

  const handleSetRequestOnBehalf = (
    application: Omit<PriorityPlacementApplication, "id" | "submittedDate">
  ) => {
    setPriorityApplications((prev) => {
      const existingIdx = prev.findIndex(
        (a) => a.studentId === application.studentId && a.periodId === application.periodId
      );
      const existing = existingIdx >= 0 ? prev[existingIdx] : null;
      const newApp = {
        ...application,
        id: existing ? existing.id : `pa-${Date.now()}`,
        submittedDate: new Date().toISOString().split("T")[0],
        published: false,
        noticeSentAt: existing?.noticeSentAt,
      };
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newApp;
        return updated;
      }
      return [...prev, newApp];
    });
    toast.success("Application submitted for student");
  };

  // Clear Local Data handler - clears all data except praksis places
  const handleClearData = () => {
    // Reset all state to initial mock data except praksis places
    setStudentPlacements(mockStudentPlacements);
    setPlacementTaskStates(mockPlacementTaskStates);
    clearPraksisStudents();
    setPriorityPeriods(mockPriorityPeriods);
    setPriorityApplications(mockPriorityApplications);
    setSelectedPriorityPeriod(null);

    // Reset view states
    setCurrentView("dashboard");
    setPraksisPlacesSubView("list");
    setSearchTerm("");
    setSelectedStudy("all");
    setSelectedProgram("all");
    setSelectedSubject("all");
    setSelectedStatus("all");
    setSelectedPeriods(new Set<PeriodOption>(["current", "next"]));
    setCustomStartDate("");
    setCustomEndDate("");
    setViewMode("list");
    setCurrentPage(1);
    setSelectedStudentPlacement(null);
    setSelectedPraksisPlace(null);
    setIsDetailModalOpen(false);

    toast.success("Local data cleared", {
      description:
        "All data except Praksis Places has been reset",
    });
  };

  // Generate Mock Placement with students for testing SK person view




  const generateMockPlacement = () => {
    // The placement is made on a real entity: its program, emne and name
    const profile = allProfiles.find(
      (p) => p.status === "active" && praksisPlaces.some((pl) => pl.id === p.praksisPlaceId),
    );
    const place = profile && praksisPlaces.find((pl) => pl.id === profile.praksisPlaceId);
    const accepted = profile?.programs.find((e) => findProgram(e.programId));
    const program = accepted ? findProgram(accepted.programId) : undefined;
    if (!profile || !place || !accepted || !program) {
      toast.error("No entity to place students on", {
        description: "Add an entity under Praksis places first",
      });
      return;
    }
    const emne =
      (accepted.emneIds[0] && findEmne(accepted.programId, accepted.emneIds[0])?.emne) || program.program.emner?.[0];

    const placementId = `placement-${Date.now()}`;
    const startDate = new Date(2026, 1, 2).toISOString();
    const endDate = new Date(2026, 5, 12).toISOString();
    const title = `${program.program.name} placement – ${profile.name}`;

    // Use mockStudents so student IDs match priority application references; never more than the profile has places
    const count = Math.max(1, Math.min(mockStudents.length, accepted.places));
    const mockPlacementStudents = mockStudents.slice(0, count).map((s) => ({
      ...s,
      assignedPraksisPlace: {
        placeId: place.id,
        placeName: place.name,
        departmentId: profile.id,
        departmentName: profile.name,
        entityId: profile.id,
        placementTaskId: placementId,
        profileId: profile.id,
        emneId: emne?.id,
        status: "booked" as const,
        startDate,
        endDate,
        placementTitle: title,
        assignedDate: new Date().toISOString(),
      },
    }));

    const newPlacement: StudentPlacement = {
      id: placementId,
      title,
      year: "2026",
      semester: "Spring",
      subject: emne?.name ?? "",
      emneId: emne?.id,
      startDate,
      endDate,
      students: count,
      status: "completed",
      studyId: program.study.id,
      programId: accepted.programId,
    };

    const newPlacementTaskState: PlacementTaskState = {
      placementId,
      studentsImported: true,
      students: mockPlacementStudents,
      studentsAssigned: true,
      documentsAttached: true,
      finalPublished: true,
      entitiesPublished: true,
      assignmentPublished: true,
      completedTasks: ["1", "2", "3", "4", "5", "6", "7", "8"],
    };

    setStudentPlacements([...studentPlacements, newPlacement]);
    setPlacementTaskStates([...placementTaskStates, newPlacementTaskState]);

    toast.success("Mock Placement Generated", {
      description: `Created placement with ${count} student${count === 1 ? "" : "s"} on ${profile.name}`,
      duration: 4000,
    });
  };

  // Every placement with its students, so any screen can tell how many students sit on a profile
  const usagePlacements = useMemo<OtherPlacementUsage[]>(
    () =>
      placementTaskStates.map((ts) => {
        const p = studentPlacements.find((sp) => sp.id === ts.placementId);
        return {
          placementId: ts.placementId,
          title: p?.title,
          year: p?.year,
          semester: p?.semester,
          startDate: p?.startDate,
          programId: p?.programId,
          emne: p?.subject,
          emneId: p?.emneId,
          students: ts.students,
        };
      }),
    [placementTaskStates, studentPlacements],
  );

  // The Praksis-students registry with each student's state, worked out from the placements
  const { students: registryStudents, claims: registryClaims } = usePraksisStudents();
  const registryRows = useMemo(
    () =>
      deriveRows(
        registryStudents,
        registryClaims,
        studentPlacements,
        new Map(placementTaskStates.map((ts) => [ts.placementId, ts.students])),
      ),
    [registryStudents, registryClaims, studentPlacements, placementTaskStates],
  );

  // Placements are not saved across a reload, so claims by placements that are gone are dropped
  useEffect(() => {
    pruneClaims(new Set(studentPlacements.map((p) => p.id)));
  }, [studentPlacements]);

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <LoginScreen
        onAuthenticated={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <ProfileUsageProvider value={usagePlacements}>
      <LeaveDialog />
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
              onViewChange={(view) =>
                goView(view, currentView, (v) => {
                  setCurrentView(v);
                  // The sidebar opens Praksis-students with its default chip, not one left from the dashboard
                  if (view === "praksisstudents") setStudentsInitialStatus(undefined);
                  // Progress onboarding if step 1 and clicking on placements
                  if (onboardingStep === 1 && view === "placements") {
                    setOnboardingStep(2);
                  }
                  // Reset praksis places sub-view when navigating away
                  if (view !== "praksisplaces") {
                    setPraksisPlacesSubView("list");
                    setSelectedPraksisPlace(null);
                  }
                })
              }
              onSettingsClick={() => goView("settings", currentView, setCurrentView)}
              onAnalyticsClick={() => goView("analytics", currentView, setCurrentView)}
              onCommentsClick={() => goView("onboarding-comments", currentView, setCurrentView)}
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
                    priorityApplications={priorityApplications}
                    priorityPeriods={priorityPeriods}
                    allPlacementsData={placementTaskStates
                      .filter((ts) => ts.placementId !== selectedStudentPlacement.id)
                      .map((ts) => ({
                        placementId: ts.placementId,
                        title: studentPlacements.find((p) => p.id === ts.placementId)?.title ?? ts.placementId,
                        year: studentPlacements.find((p) => p.id === ts.placementId)?.year,
                        semester: studentPlacements.find((p) => p.id === ts.placementId)?.semester,
                        startDate: studentPlacements.find((p) => p.id === ts.placementId)?.startDate,
                        programId: studentPlacements.find((p) => p.id === ts.placementId)?.programId,
                        emne: studentPlacements.find((p) => p.id === ts.placementId)?.subject,
                        emneId: studentPlacements.find((p) => p.id === ts.placementId)?.emneId,
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
                    }}
                    onPlacementMetadataUpdate={
                      handlePlacementMetadataUpdate
                    }
                    registryRows={registryRows}
                    onPlacementDelete={(placementId) => {
                      releasePlacement(placementId);
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
                    onOpenPraksisPlaces={() => goView("praksisplaces", currentView, setCurrentView)}
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
                                      }}
                    isAISidebarOpen={isAISidebarOpen}
                    onAISidebarChange={setIsAISidebarOpen}
                    onboardingStep={onboardingStep}
                    onboardingData={onboardingData}
                    setOnboardingStep={setOnboardingStep}
                    studies={studies}
                  />
                ) : (
                  <div className="flex flex-col gap-5 items-center justify-start h-full w-full">
                    {currentView === "praksisstudents" ? (
                      <PraksisStudentsView
                        rows={registryRows}
                        initialStatus={studentsInitialStatus}
                        historyOf={(studentId) =>
                          placementHistoryOf(studentId, studentPlacements, new Map(placementTaskStates.map((ts) => [ts.placementId, ts.students])))
                        }
                        priorityApplications={priorityApplications}
                        onOpenPlacement={(placementId) => {
                          const target = studentPlacements.find((p) => p.id === placementId);
                          if (target) handleStudentPlacementClick(target);
                        }}
                      />
                    ) : currentView === "dashboard" ? (
                      <Dashboard
                        placements={studentPlacements}
                        placementTaskStates={
                          placementTaskStates
                        }
                        praksisPlaces={praksisPlaces}
                        studies={studies}
                        onPlacementClick={
                          handleStudentPlacementClick
                        }
                        onPraksisPlaceClick={(place) => {
                          setSelectedPraksisPlace(place);
                          setPraksisPlacesSubView("list");
                          setCurrentView("praksisplaces");
                        }}
                        onViewAllClick={() =>
                          setCurrentView("placements")
                        }
                        onViewAllPraksisPlacesClick={() =>
                          setCurrentView("praksisplaces")
                        }
                        onStartOnboarding={() =>
                          setOnboardingStep(1)
                        }
                        studentRows={registryRows}
                        onOpenPraksisStudents={(status) => {
                          setStudentsInitialStatus(status);
                          goView("praksisstudents", currentView, setCurrentView);
                        }}
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
                    ) : currentView === "students" ? (
                      <StudentsView
                        students={enrolledStudents}
                        placementTaskStates={placementTaskStates}
                        studentPlacements={studentPlacements}
                        priorityApplications={priorityApplications}
                        studies={studies}
                      />
                    ) : currentView === "placementreport" ? (
                      <PlacementReportView
                        placements={studentPlacements}
                        placementTaskStates={placementTaskStates}
                        praksisPlaces={praksisPlaces}
                        studies={studies}
                      />
                    ) : currentView === "capacityreport" ? (
                      <CapacityPlanningReportView
                        praksisPlaces={praksisPlaces}
                        placements={studentPlacements}
                        placementTaskStates={placementTaskStates}
                        studies={studies}
                      />
                    ) : currentView === "invoicereport" ? (
                      <InvoiceReportView
                        placements={studentPlacements}
                        placementTaskStates={placementTaskStates}
                        enrolledStudents={enrolledStudents}
                        praksisPlaces={praksisPlaces}
                        studies={studies}
                      />
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
                    ) : currentView === "priorities" ? (
                      <PrioritiesView
                        periods={priorityPeriods}
                        applications={priorityApplications}
                        enrolledStudents={enrolledStudents}
                        studies={studies}
                        currentUserName="John Coordinator"
                        onPeriodCreate={handlePriorityPeriodCreate}
                        onPeriodToggleStatus={handlePriorityPeriodToggleStatus}
                        onDeletePeriod={handleDeletePeriod}
                        onUpdatePeriodDate={handlePriorityPeriodUpdateDate}
                        onSelectPeriod={(period) => {
                          setSelectedPriorityPeriod(period);
                          setCurrentView("priorityitem");
                        }}
                      />
                    ) : currentView === "priorityitem" && selectedPriorityPeriod ? (
                      <PriorityItemDetailView
                        period={
                          priorityPeriods.find((p) => p.id === selectedPriorityPeriod.id) ??
                          selectedPriorityPeriod
                        }
                        applications={priorityApplications.filter(
                          (a) => a.periodId === selectedPriorityPeriod.id
                        )}
                        enrolledStudents={enrolledStudents}
                        studies={studies}
                        currentUserName="John Coordinator"
                        onBack={() => {
                          setCurrentView("priorities");
                          setSelectedPriorityPeriod(null);
                        }}
                        onImportStudents={handlePriorityItemImportStudents}
                        onAddStudents={handleAddStudentsToPeriod}
                        onSendFirstNotice={handleSendFirstNotice}
                        onSendIndividualNotice={handleSendIndividualNotice}
                        onPublishResults={handlePublishResults}
                        onReopenPeriod={handleReopenPriority}
                        onUpdatePeriodDate={handlePriorityPeriodUpdateDate}
                        onApplicationApprove={handlePriorityApplicationApprove}
                        onApplicationReject={handlePriorityApplicationReject}
                        onSetRequestOnBehalf={handleSetRequestOnBehalf}
                      />
                    ) : currentView === "praksisplaces" ? (
                      <>
                        {praksisPlacesSubView === "list" && (
                          <PraksisPlacesView
                            places={praksisPlaces}
                            onCreatePlace={
                              handleCreatePraksisPlace
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

                        {/* Filters, period filter & view controls */}
                        <PlacementFilterBar
                          searchTerm={searchTerm}
                          onSearchChange={setSearchTerm}
                          studies={studies}
                          selectedStudy={selectedStudy}
                          onStudyChange={setSelectedStudy}
                          selectedProgram={selectedProgram}
                          onProgramChange={setSelectedProgram}
                          selectedSubject={selectedSubject}
                          onSubjectChange={setSelectedSubject}
                          subjects={placementSubjects}
                          selectedStatus={selectedStatus}
                          onStatusChange={setSelectedStatus}
                          selectedPeriods={selectedPeriods}
                          setSelectedPeriods={setSelectedPeriods}
                          customStartDate={customStartDate}
                          setCustomStartDate={setCustomStartDate}
                          customEndDate={customEndDate}
                          setCustomEndDate={setCustomEndDate}
                          semesterRanges={semesterRanges}
                          viewMode={viewMode}
                          onViewModeChange={setViewMode}
                          actions={
                            <>
                              <CreatePlacementButton
                                onCreatePlacement={handleCreatePlacement}
                                onboardingStep={onboardingStep}
                                onboardingData={onboardingData}
                                setOnboardingStep={setOnboardingStep}
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsPlacementHelpOpen(true)}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                              >
                                <HelpCircle className="h-4 w-4" />
                                <span className="font-medium">Help</span>
                              </Button>
                            </>
                          }
                        />

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
                                  onValueChange={(value: string) =>
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
        initialStep={initialOnboardingStep}
      />

      {/* Placement Task Help Overlay */}
      <PlacementTaskHelpOverlay
        isOpen={isPlacementHelpOpen}
        onClose={() => setIsPlacementHelpOpen(false)}
      />

      <Toaster />
    </div>
    </ProfileUsageProvider>
  );
}