import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Filter,
  Building2,
  Users,
  Plus,
  X,
  Paperclip,
  Upload,
  Trash2,
  File,
  ChevronDown,
  CheckCircle,
  ClipboardCheck,
  User,
  Layers,
  Columns3,
  Info,
  Network,
  Clock,
  XCircle,
  HelpCircle,
  Search,
  ChevronUp,
  ArrowUpDown,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Pencil,
} from "lucide-react";
import imgButton from "figma:asset/b43e117ee3af1d4270d7dc2e21fae9993aece0e2.png";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { PlacementTasksModal } from "./PlacementTasksModal";
import { QuickAssignStudentsModal } from "./QuickAssignStudentsModal";
import {
  SlideOverManageQuota,
  QuotaSelection,
} from "./SlideOverManageQuota";
import { AISupportSidebar } from "./AISupportSidebar";
import { FirstPublishModal } from "./FirstPublishModal";
import { PlacementNetworkDiagramModal } from "./PlacementNetworkDiagramModal";
import { RequestQuotaModal } from "./RequestQuotaModal";
import { PlacementTaskHelpOverlay } from "./PlacementTaskHelpOverlay";
import { StudentPlacement } from "../types/studentPlacement";
import { Study } from "./SettingsView";
import {
  PraksisPlace,
  QuotaRequest,
} from "../types/praksisPlace";
import {
  Student,
  PlacementTask,
  placementTasks,
  mockStudents,
} from "../types/placementTask";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "./ui/breadcrumb";
import { QuotaOffering } from "../types/quotaOffering";
import { CoordinatorQuotaRequest } from "../types/coordinatorQuotaRequest";
import { toast } from "sonner@2.0.3";
import AvailableQuotasTable from "./AvailableQuotasTable";
import { findNodeById } from "../types/organizationStructure";

interface PlacementTaskViewProps {
  placement: StudentPlacement;
  praksisPlaces: PraksisPlace[];
  quotaRequests: QuotaRequest[];
  coordinatorQuotaRequests?: CoordinatorQuotaRequest[];
  studies: Study[];
  onBack: () => void;
  isAISidebarOpen?: boolean;
  onAISidebarChange?: (isOpen: boolean) => void;
  onQuotaRequestCreate?: (requests: any[]) => void;
  onCoordinatorQuotaRequestCreate?: (request: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => void;
  onCoordinatorQuotaRequestUpdate?: (requestId: string, updates: Partial<CoordinatorQuotaRequest>) => void;
  currentUserName?: string;
  onPlacementStatusUpdate?: (
    placementId: string,
    status:
      | "draft"
      | "upload"
      | "select"
      | "publish"
      | "completed",
  ) => void;
  onPlacementMetadataUpdate?: (
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
  ) => void;
  onPlacementDelete?: (placementId: string) => void;
  initialTaskState?: {
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
    assignmentPublished?: boolean;
    assignmentPublishedDate?: string;
  };
  onTaskStateUpdate?: (state: any) => void;
  onboardingStep?: number;
  onboardingData?: any;
  setOnboardingStep?: (step: number) => void;
  prefillData?: {
    studyId: string;
    programId: string;
    subject: string;
    startDate: string;
    endDate: string;
  };
}

export function PlacementTaskView({
  placement,
  praksisPlaces,
  quotaRequests,
  coordinatorQuotaRequests = [],
  studies,
  onBack,
  isAISidebarOpen = false,
  onAISidebarChange,
  onQuotaRequestCreate,
  onCoordinatorQuotaRequestCreate,
  onCoordinatorQuotaRequestUpdate,
  currentUserName = 'PK Coordinator',
  onPlacementStatusUpdate,
  onPlacementMetadataUpdate,
  onPlacementDelete,
  initialTaskState,
  onTaskStateUpdate,
  onboardingStep,
  onboardingData,
  setOnboardingStep,
  prefillData,
}: PlacementTaskViewProps) {
  // Metadata form state for draft placements
  const [metadataFormData, setMetadataFormData] = useState(() => {
    if (prefillData) {
      // Dates are already in YYYY-MM-DD format, use them directly
      const startDateFormatted = prefillData.startDate;
      
      // Calculate year and semester from start date (use string parsing to avoid timezone issues)
      const [yearStr, monthStr] = prefillData.startDate.split('-');
      const year = yearStr;
      const month = parseInt(monthStr, 10) - 1; // 0-indexed (0=Jan, 7=Aug)
      const semester = month < 7 ? "Spring" : "Autumn";
      
      return {
        title: "",
        year,
        semester,
        subject: prefillData.subject,
        startDate: startDateFormatted,
        endDate: prefillData.endDate,
        students: 50,
        studyId: prefillData.studyId,
        programId: prefillData.programId,
      };
    }
    return {
      title: "",
      year: "",
      semester: "",
      subject: "",
      startDate: "",
      endDate: "",
      students: 50,
      studyId: "",
      programId: "",
    };
  });

  const [students, setStudents] = useState<Student[]>(
    initialTaskState?.students || [],
  );
  const [dateValidationError, setDateValidationError] = useState<string>("");
  const [tasks, setTasks] =
    useState<PlacementTask[]>(placementTasks);
  const [isTasksModalOpen, setIsTasksModalOpen] =
    useState(false);
  const [isManageQuotaModalOpen, setIsManageQuotaModalOpen] =
    useState(false);
  const [isRequestQuotaModalOpen, setIsRequestQuotaModalOpen] =
    useState(false);
  const [isQuickAssignModalOpen, setIsQuickAssignModalOpen] = useState(false);
  const [selectedQuotaForAssignment, setSelectedQuotaForAssignment] = useState<{
    requestId: string;
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
    availableCapacity: number;
  } | null>(null);
  const [isQuotaSelectionDialogOpen, setIsQuotaSelectionDialogOpen] = useState(false);
  const [showPublishWarning, setShowPublishWarning] = useState(false);
  const [editingQuotaRequest, setEditingQuotaRequest] = useState<CoordinatorQuotaRequest | null>(null);
  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<
    Set<string>
  >(new Set());
  const [studentsImported, setStudentsImported] = useState(
    initialTaskState?.studentsImported || false,
  );
  const [quotasSelected, setQuotasSelected] = useState(
    initialTaskState?.quotasSelected || false,
  );
  const [quotas, setQuotas] = useState<QuotaSelection[]>(
    initialTaskState?.quotas || [],
  );
  const [autoImportedQuotasCount, setAutoImportedQuotasCount] = useState(0);
  const [isAutoImportAlertDismissed, setIsAutoImportAlertDismissed] = useState(false);

  // Track imported coordinator quota request IDs to avoid re-importing
  const importedCoordinatorRequestIds = useRef<Set<string>>(new Set());

  // Date input refs for calendar icon clicks
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);

  // Quick assign state for Quota Overview

  // Actions dropdown state
  const [isActionsDropdownOpen, setIsActionsDropdownOpen] =
    useState(false);
  const [isStudentsExpanded, setIsStudentsExpanded] = useState(false);
  const [isAssignmentPublished, setIsAssignmentPublished] = useState(
    initialTaskState?.assignmentPublished ?? false
  );
  const [assignmentPublishedDate, setAssignmentPublishedDate] = useState<string | null>(
    initialTaskState?.assignmentPublishedDate ?? null
  );
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [wasEverPublished, setWasEverPublished] = useState(
    initialTaskState?.assignmentPublished ?? false
  );

  // Congratulations state for completed placement
  const [showCongratulations, setShowCongratulations] =
    useState(false);

  // First Publish modal state
  const [isFirstPublishModalOpen, setIsFirstPublishModalOpen] =
    useState(false);

  // Network Diagram modal state
  const [isNetworkDiagramOpen, setIsNetworkDiagramOpen] =
    useState(false);

  // Help overlay state
  const [isHelpOverlayOpen, setIsHelpOverlayOpen] = useState(false);

  // Placement history expanded state
  const [
    expandedPlacementHistory,
    setExpandedPlacementHistory,
  ] = useState<Set<string>>(new Set());

  // Track if we've initialized from initialTaskState to avoid infinite loops
  const hasInitialized = useRef(false);

  const togglePlacementHistory = (studentId: string) => {
    setExpandedPlacementHistory((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    student: true,
    placementHistory: true,
    assignedPlace: true,
    supervisor: false,
    customRequest: true,
    attachFiles: true,
    priorities: true,
  });

  const [isColumnMenuOpen, setIsColumnMenuOpen] =
    useState(false);

  // Visual filter: show only unassigned students in the table
  const [showUnassignedOnly, setShowUnassignedOnly] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSortDir, setStudentSortDir] = useState<'asc' | 'desc' | null>(null);

  const toggleColumn = (
    column: keyof typeof visibleColumns,
  ) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column],
    }));
  };

  // Calculate stats
  const placementsMadeCount = students.filter(
    (s) => s.assignedPraksisPlace,
  ).length;
  const placementsPendingCount =
    students.length - placementsMadeCount;
  const totalFixedQuotas = quotas.reduce(
    (sum, q) => sum + q.fixedQuota,
    0,
  );
  const totalRequestQuotas = quotas.reduce(
    (sum, q) => sum + q.requestQuota,
    0,
  );

  // Calculate approved request quotas from quotaRequests
  const totalApprovedRequestQuotas = quotas.reduce(
    (sum, quota) => {
      const matchingRequest = quotaRequests.find(
        (qr) =>
          qr.placementId === placement.id &&
          qr.departmentId === quota.departmentId,
      );

      if (matchingRequest?.requestQuotaStatus === "approved") {
        return sum + matchingRequest.requestQuota;
      }
      return sum;
    },
    0,
  );

  // Calculate approved coordinator quota requests matching this placement
  const totalCoordinatorApprovedQuotas = coordinatorQuotaRequests
    ? coordinatorQuotaRequests.reduce((sum, req) => {
        // Match by placement context (study/program/dates)
        const matchesStudy = req.studyId === placement.studyId || req.studyId === metadataFormData.studyId;
        const matchesProgram = req.programId === placement.programId || req.programId === metadataFormData.programId;
        const isApproved = req.status === "approved";

        // Check if placement dates are within quota request dates
        let matchesDates = true;
        const placementStart = placement.startDate || metadataFormData.startDate;
        const placementEnd = placement.endDate || metadataFormData.endDate;
        
        if (placementStart && placementEnd) {
          const ps = new Date(placementStart);
          const pe = new Date(placementEnd);
          const qs = new Date(req.startDate);
          const qe = new Date(req.endDate);

          ps.setHours(0, 0, 0, 0);
          pe.setHours(0, 0, 0, 0);
          qs.setHours(0, 0, 0, 0);
          qe.setHours(0, 0, 0, 0);

          // Placement must be within quota date range
          matchesDates = ps >= qs && pe <= qe;
        }

        if (isApproved && matchesStudy && matchesProgram && matchesDates) {
          // Handle multi-entity requests
          if (req.entityDistributions && req.entityDistributions.length > 0) {
            let totalAvailable = 0;
            for (const entity of req.entityDistributions) {
              const entityAssignedCount = students.filter(
                (s) =>
                  s.assignedPraksisPlace?.placeId === req.praksisPlaceId &&
                  s.assignedPraksisPlace?.entityId === entity.entityId &&
                  s.assignedPraksisPlace?.quotaRequestId === req.id
              ).length;
              
              // Mirror legacy fallback: use requestedQuota when approvedQuota was never explicitly set
              const entityApprovedCapacity =
                entity.approvedQuota !== undefined ? entity.approvedQuota : entity.requestedQuota;
              const entityAvailableCapacity = Math.max(0, entityApprovedCapacity - entityAssignedCount);
              totalAvailable += entityAvailableCapacity;
            }
            return sum + totalAvailable;
          } else {
            // Legacy single-entity request
            const assignedCount = students.filter(
              (s) =>
                s.assignedPraksisPlace?.placeId === req.praksisPlaceId &&
                s.assignedPraksisPlace?.departmentId === req.departmentId &&
                s.assignedPraksisPlace?.quotaRequestId === req.id
            ).length;
            
            const approvedCapacity = req.approvedCapacity ?? req.requestedCapacity;
            const availableCapacity = Math.max(0, approvedCapacity - assignedCount);
            
            return sum + availableCapacity;
          }
        }
        return sum;
      }, 0)
    : 0;

  // Build a set of "placeName|entityName" keys for all quota entities in this placement
  // Used to flag placement history records that overlap with available quotas
  const quotaEntityKeys = new Set<string>(
    coordinatorQuotaRequests.flatMap((req) => {
      if (req.entityDistributions && req.entityDistributions.length > 0) {
        return req.entityDistributions.map(
          (e) => `${req.praksisPlaceName.toLowerCase()}|${e.entityName.toLowerCase()}`
        );
      }
      return [`${req.praksisPlaceName.toLowerCase()}|${req.departmentName.toLowerCase()}`];
    })
  );

  // Only use coordinator approved quotas (available capacity)
  // The old quota system (totalFixedQuotas, totalApprovedRequestQuotas) is deprecated
  // and causes duplication since approved coordinator requests are auto-imported as fixedQuota
  const totalQuotas = totalCoordinatorApprovedQuotas;

  // Get current task
  const currentTask = tasks.find((t) => !t.completed);

  const handleImportStudents = () => {
    // Only import if not already imported
    if (!studentsImported) {
      setStudents(mockStudents);
      setStudentsImported(true);
    }
    // Step 1/6 will auto-complete via useEffect
  };

  const handleTaskAction = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Remove navigate action handling
    if (task.actionType === "mark") {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: true } : t,
        ),
      );
    } else if (task.actionType === "publish") {
      // For 2/6 First publish, open the modal
      if (task.step === "2/6") {
        setIsFirstPublishModalOpen(true);
        return;
      }

      // For 6/6 Second publish, check if all mandatory tasks are completed
      if (task.step === "6/6") {
        const mandatoryTasks = tasks.filter(
          (t) => t.status === "mandatory" && t.id !== taskId,
        );
        const allMandatoryCompleted = mandatoryTasks.every(
          (t) => t.completed,
        );

        if (!allMandatoryCompleted) {
          alert(
            "Cannot publish: Please complete all mandatory tasks before publishing.",
          );
          return;
        }
      }

      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId ? { ...t, completed: true } : t,
        ),
      );
    }
  };

  // Removed: autoImportQuotasFromOfferings function (quota offerings no longer used)

  // Auto-import approved coordinator quota requests into quotas state
  const autoImportApprovedQuotaRequests = (): number => {
    // 1. Filter for approved requests for this placement that haven't been imported yet
    const approvedRequests = coordinatorQuotaRequests.filter(
      (request) =>
        request.placementId === placement.id &&
        request.status === 'approved' &&
        !importedCoordinatorRequestIds.current.has(request.id)
    );

    if (approvedRequests.length === 0) {
      return 0;
    }

    // 2. Get current quotas
    const existingQuotas = quotas;

    // 3. Convert to QuotaSelection format and merge with existing or create new
    const updatedQuotasMap = new Map<string, QuotaSelection>();
    
    // First, add all existing quotas to the map
    existingQuotas.forEach((quota) => {
      const key = `${quota.placeId}-${quota.departmentId}`;
      updatedQuotasMap.set(key, { ...quota });
    });

    // Then, add or update with approved requests
    let newImportCount = 0;
    approvedRequests.forEach((request) => {
      const key = `${request.praksisPlaceId}-${request.departmentId}`;
      const existing = updatedQuotasMap.get(key);
      
      if (existing) {
        // If quota already exists, just ensure it's there (fixedQuota already set from offerings)
        // The approved request quota is handled separately in calculations
      } else {
        // Create new quota entry for approved request
        updatedQuotasMap.set(key, {
          placeId: request.praksisPlaceId,
          placeName: request.praksisPlaceName,
          departmentId: request.departmentId,
          departmentName: request.departmentName,
          fixedQuota: request.requestedCapacity, // Use approved capacity as fixed quota
          requestQuota: 0,
        });
        newImportCount++;
      }
      
      // Mark this request as imported
      importedCoordinatorRequestIds.current.add(request.id);
    });

    // 4. Update quotas if there are new ones
    if (newImportCount > 0) {
      const updatedQuotas = Array.from(updatedQuotasMap.values());
      setQuotas(updatedQuotas);
      setQuotasSelected(true);

      // Notify parent component
      if (onTaskStateUpdate) {
        const completedTaskIds = tasks
          .filter((t) => t.completed)
          .map((t) => t.id);
        const allStudentsAssigned =
          students.length > 0 &&
          students.every((s) => s.assignedPraksisPlace);

        onTaskStateUpdate({
          placementId: placement.id,
          studentsImported,
          students,
          quotasSelected: true,
          quotas: updatedQuotas,
          firstPublished:
            tasks.find((t) => t.step === "2/6")?.completed ||
            false,
          studentsAssigned: allStudentsAssigned,
          documentsAttached:
            tasks.find((t) => t.step === "5/6")?.completed ||
            false,
          finalPublished:
            tasks.find((t) => t.step === "6/6")?.completed ||
            false,
          completedTasks: completedTaskIds,
        });
      }
    }

    return newImportCount;
  };

  const handleMetadataFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate dates before submission
    if (dateValidationError) {
      return;
    }

    if (onPlacementMetadataUpdate) {
      onPlacementMetadataUpdate(placement.id, metadataFormData);
    }

    // Update status from draft to upload
    if (
      onPlacementStatusUpdate &&
      placement.status === "draft"
    ) {
      onPlacementStatusUpdate(placement.id, "upload");
    }

    // Progress onboarding if in step 3
    if (onboardingStep === 3 && setOnboardingStep) {
      setOnboardingStep(0); // Complete onboarding
    }
  };

  const handleCancelDraft = () => {
    if (placement.status === "draft" && onPlacementDelete) {
      onPlacementDelete(placement.id);
    }
    onBack();
  };

const handleFirstPublish = (
    deadline: string,
    message: string,
  ) => {
    // Mark task 2/6 as complete
    setTasks((prev) =>
      prev.map((t) =>
        t.step === "2/6" ? { ...t, completed: true } : t,
      ),
    );

    // Update placement status to "publish" so SK can see the request (but not students yet)
    if (onPlacementStatusUpdate) {
      onPlacementStatusUpdate(placement.id, "publish");
    }

    // Simulate students submitting their requests after a short delay
    setTimeout(() => {
      // Generate random responses for each student
      const praksisPlaceNames = [
        ...new Set(praksisPlaces.map((p) => p.name)),
      ];

      const sampleMessages = [
        "I would prefer this location as it's close to my home.",
        "I'm interested in this department because of my previous experience in similar settings.",
        "This praksis place aligns well with my career goals.",
        "I have specific interest in the programs offered here.",
        "Would be great if I could get placed here due to transportation convenience.",
      ];

      setStudents((prev) =>
        prev.map((student) => {
          // Randomly select if student submits (80% chance)
          const submits = Math.random() > 0.2;

          if (submits) {
            const randomPlace =
              praksisPlaceNames[
                Math.floor(
                  Math.random() * praksisPlaceNames.length,
                )
              ];
            const randomMessage =
              sampleMessages[
                Math.floor(
                  Math.random() * sampleMessages.length,
                )
              ];

            return {
              ...student,
              customRequestSubmitted: true,
              customRequest: {
                preferredPlaceName: randomPlace,
                message: randomMessage,
                submittedAt: new Date().toISOString(),
              },
            };
          }

          return student;
        }),
      );
    }, 2000); // Simulate 2 second delay for students to respond
  };

  const handleAssignStudent = (
    studentId: string,
    placeId: string,
    departmentId: string,
    requestApproval?: boolean,
    quotaRequestId?: string,
    entityId?: string, // Add entityId parameter for multi-entity support
  ) => {
    const place = praksisPlaces.find((p) => p.id === placeId);
    
    if (!place) {
      console.error('[handleAssignStudent] Place not found:', placeId, 'Available places:', praksisPlaces.map(p => p.id));
      toast.error('Could not find the selected praksis place');
      return;
    }
    
    // Try to find department in flat departments array first
    let department = place?.departments.find(
      (d) => d.id === departmentId,
    );
    
    // If not found in flat array, try finding in hierarchical organization structure
    let departmentName = department?.name;
    if (!department && place?.organizationStructure) {
      const node = findNodeById(place.organizationStructure, departmentId);
      if (node) {
        departmentName = node.name;
      }
    }

    if (!departmentName) {
      console.error('[handleAssignStudent] Department not found:', departmentId, 'Available departments:', place.departments?.map(d => d.id), 'Organization structure:', place.organizationStructure);
      toast.error('Could not find the selected department');
      return;
    }

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              assignedPraksisPlace: {
                placeId,
                placeName: place.name,
                departmentId,
                departmentName: departmentName,
                entityId: entityId || departmentId, // Store entityId (defaults to departmentId for backward compatibility)
                placementTaskId: placement.id, // Add placement ID so SK can filter by completed placements
                quotaRequestId, // Link to specific coordinator quota request
                startDate: placement.startDate,
                endDate: placement.endDate,
                placementTitle: placement.title,
                assignedDate: new Date().toISOString(),
                approvalRequested: requestApproval,
                approvalStatus: requestApproval
                  ? "pending"
                  : undefined,
              },
            }
          : s,
      ),
    );
  };


  const handleToggleStudentSelection = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

const handleSaveQuotas = (newQuotas: QuotaSelection[]) => {
    setQuotas(newQuotas);

    // Create QuotaRequest objects for contact person view
    if (onQuotaRequestCreate) {
      const requests: any[] = [];
      const timestamp = Date.now();
      let counter = 0;

      newQuotas.forEach((quota) => {
        // Find existing quota request for this placement + place + department
        const existingRequest = quotaRequests.find(
          (qr) =>
            qr.placementId === placement.id &&
            qr.praksisPlaceId === quota.placeId &&
            qr.departmentId === quota.departmentId,
        );

        const baseRequest = {
          placementId: placement.id,
          placementTitle: placement.title,
          placementYear: placement.year,
          placementSemester: placement.semester,
          requestedBy: "Coordinator",
          praksisPlaceId: quota.placeId,
          praksisPlaceName: quota.placeName,
          departmentId: quota.departmentId,
          departmentName: quota.departmentName,
          requestedDate: existingRequest
            ? existingRequest.requestedDate
            : new Date().toISOString(),
          startDate: placement.startDate,
          endDate: placement.endDate,
          placementStatus: placement.status, // Include current placement status
        };

        // Determine if this is a new request or an update
        if (existingRequest) {
          // UPDATE: Compare values and track changes
          const historyItems: any[] = [
            ...(existingRequest.history || []),
          ];
          let needsReapproval = false;

          // Check if fixedQuota changed
          if (existingRequest.fixedQuota !== quota.fixedQuota) {
            historyItems.unshift({
              id: `h-${timestamp}-${counter++}`,
              timestamp: new Date().toISOString(),
              action: "updated",
              performedBy: "Coordinator",
              performedByRole: "coordinator",
              changes: [
                {
                  field: "fixedQuota",
                  oldValue: existingRequest.fixedQuota,
                  newValue: quota.fixedQuota,
                },
              ],
              notes: `Added quota updated from ${existingRequest.fixedQuota} to ${quota.fixedQuota}`,
            });
          }

          // Check if requestQuota changed
          if (
            existingRequest.requestQuota !== quota.requestQuota
          ) {
            historyItems.unshift({
              id: `h-${timestamp}-${counter++}`,
              timestamp: new Date().toISOString(),
              action: "updated",
              performedBy: "Coordinator",
              performedByRole: "coordinator",
              changes: [
                {
                  field: "requestQuota",
                  oldValue: existingRequest.requestQuota,
                  newValue: quota.requestQuota,
                },
              ],
              notes: `Requested quota updated from ${existingRequest.requestQuota} to ${quota.requestQuota} - requires re-approval`,
            });
            needsReapproval = true;
          }

          // Create updated request
          if (quota.fixedQuota > 0 || quota.requestQuota > 0) {
            requests.push({
              ...existingRequest,
              ...baseRequest,
              fixedQuota: quota.fixedQuota,
              requestQuota: quota.requestQuota,
              requestQuotaStatus: needsReapproval
                ? "pending"
                : quota.requestQuota > 0
                  ? existingRequest.requestQuotaStatus
                  : "approved",
              updatedDate: new Date().toISOString(),
              updatedBy: "Coordinator",
              history: historyItems,
            });
          }
        } else {
          // NEW REQUEST: Create fresh history
          const historyItems: any[] = [];

          if (quota.fixedQuota > 0) {
            historyItems.push({
              id: `h-${timestamp}-${counter++}`,
              timestamp: new Date().toISOString(),
              action: "created",
              performedBy: "Coordinator",
              performedByRole: "coordinator",
              status: "approved",
              notes: `Direct assignment created with ${quota.fixedQuota} quota - automatically approved`,
            });
          }

          if (quota.requestQuota > 0) {
            historyItems.push({
              id: `h-${timestamp}-${counter++}`,
              timestamp: new Date().toISOString(),
              action: "created",
              performedBy: "Coordinator",
              performedByRole: "coordinator",
              status: "pending",
              notes: `Request created for ${quota.requestQuota} quota - pending approval`,
            });
          }

          if (quota.fixedQuota > 0 || quota.requestQuota > 0) {
            requests.push({
              id: `qr-${timestamp}-${counter++}`,
              ...baseRequest,
              fixedQuota: quota.fixedQuota,
              requestQuota: quota.requestQuota,
              requestQuotaStatus:
                quota.requestQuota > 0 ? "pending" : "approved",
              history: historyItems,
            });
          }
        }
      });

      onQuotaRequestCreate(requests);
    }

    // Step 1/6 will auto-complete via useEffect
  };

  const handleOpenManageQuota = () => {
    setIsManageQuotaModalOpen(true);
  };

  // Handle quota request submit
  const handleRequestQuotaSubmit = (requestData: Omit<CoordinatorQuotaRequest, 'id' | 'requestedDate' | 'status'>) => {
    if (onCoordinatorQuotaRequestCreate) {
      onCoordinatorQuotaRequestCreate(requestData);
      setIsRequestQuotaModalOpen(false);
    }
  };

  // Handle quick assign from Available Quotas Table
  const handleQuickAssign = (quotaInfo: {
    requestId: string;
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
    availableCapacity: number;
    entityId?: string; // Add entityId for multi-entity support
  }) => {
    // Filter unassigned students
    const unassignedStudents = students.filter(s => !s.assignedPraksisPlace);
    
    if (unassignedStudents.length === 0) {
      toast.error('No unassigned students available');
      return;
    }
    
    if (quotaInfo.availableCapacity === 0) {
      toast.error('No available capacity in this quota');
      return;
    }
    
    // Store quota info and open assignment modal
    setSelectedQuotaForAssignment(quotaInfo);
    setIsQuickAssignModalOpen(true);
  };

  // Handle request more quotas
  const handleRequestMoreQuotas = () => {
    setIsRequestQuotaModalOpen(true);
  };

  // Handle approve quota request
  const handleApproveRequest = async (requestId: string, approvedCapacity: number, entityId?: string) => {
    if (!onCoordinatorQuotaRequestUpdate) return;

    if (entityId) {
      // Per-entity approval: update only this entity's approvedQuota inside entityDistributions
      const request = coordinatorQuotaRequests.find(r => r.id === requestId);
      if (request?.entityDistributions) {
        const updatedDistributions = request.entityDistributions.map(e =>
          e.entityId === entityId ? { ...e, approvedQuota: approvedCapacity } : e
        );
        // Promote the whole request to 'approved' only once every entity has been approved
        const allApproved = updatedDistributions.every(e => e.approvedQuota !== undefined);
        onCoordinatorQuotaRequestUpdate(requestId, {
          entityDistributions: updatedDistributions,
          ...(allApproved ? { status: 'approved' as const } : {}),
        });
        toast.success(`Approved capacity of ${approvedCapacity} for ${request.entityDistributions.find(e => e.entityId === entityId)?.entityName ?? entityId}`);
      }
    } else {
      // Legacy single-entity request
      onCoordinatorQuotaRequestUpdate(requestId, {
        status: 'approved',
        approvedCapacity,
      });
      toast.success(`Quota request approved with capacity of ${approvedCapacity}`);
    }
  };

  // Handle edit quota request
  const handleEditRequest = (requestId: string) => {
    const request = coordinatorQuotaRequests.find(r => r.id === requestId);
    if (request) {
      setEditingQuotaRequest(request);
      setIsRequestQuotaModalOpen(true);
    }
  };

  // Handle delete quota request
  const handleDeleteRequest = (requestId: string, entityId?: string) => {
    if (!onCoordinatorQuotaRequestUpdate) return;

    if (entityId) {
      // Per-entity delete: remove only this entity from entityDistributions
      const request = coordinatorQuotaRequests.find(r => r.id === requestId);
      if (request?.entityDistributions) {
        const updatedDistributions = request.entityDistributions.filter(
          e => e.entityId !== entityId,
        );
        if (updatedDistributions.length === 0) {
          // No entities left — reject the whole request
          onCoordinatorQuotaRequestUpdate(requestId, { status: 'rejected' });
        } else {
          onCoordinatorQuotaRequestUpdate(requestId, { entityDistributions: updatedDistributions });
        }
        toast.success('Entity removed from quota request');
      }
    } else {
      // Single-entity or whole-request delete
      onCoordinatorQuotaRequestUpdate(requestId, { status: 'rejected' });
      toast.success('Quota request deleted successfully');
    }
  };

  // Handle update quota request (from edit mode)
  const handleUpdateQuotaRequest = (requestId: string, updates: Partial<CoordinatorQuotaRequest>) => {
    if (onCoordinatorQuotaRequestUpdate) {
      onCoordinatorQuotaRequestUpdate(requestId, updates);
      setIsRequestQuotaModalOpen(false);
      setEditingQuotaRequest(null);
      toast.success('Quota request updated successfully');
    }
  };

  // Get available quota requests with capacity for student assignment
  const getAvailableQuotaRequests = () => {
    // Each approved request may have entityDistributions — expand those into one entry each.
    // Non-entity requests produce a single entry (legacy behaviour).
    const result: Array<{
      id: string; // unique key (may be "requestId-entityId" for distributions)
      praksisPlaceId: string;
      praksisPlaceName: string;
      departmentId: string;
      departmentName: string;
      requestedCapacity: number;
      approvedCapacity?: number;
      startDate: string;
      endDate: string;
      emne?: string;
      studyId: string;
      programId: string;
      assignedCount: number;
      availableCount: number;
      _quotaRequestId: string; // original CoordinatorQuotaRequest.id for assignment tracking
      _entityId?: string;      // entity distribution entityId, if applicable
    }> = [];

    for (const request of coordinatorQuotaRequests) {
      if (request.status !== 'approved') continue;

      const matchesStudy = request.studyId === (metadataFormData.studyId || placement.studyId);
      const matchesProgram = request.programId === (metadataFormData.programId || placement.programId);
      if (!matchesStudy || !matchesProgram) continue;

      if (request.entityDistributions && request.entityDistributions.length > 0) {
        // Expand into one entry per entity distribution
        for (const entity of request.entityDistributions) {
          const capacity = entity.approvedQuota ?? entity.requestedQuota;
          const assignedCount = students.filter(
            s =>
              s.assignedPraksisPlace?.quotaRequestId === request.id &&
              s.assignedPraksisPlace?.entityId === entity.entityId,
          ).length;
          const availableCount = capacity - assignedCount;
          if (availableCount <= 0) continue;

          result.push({
            id: `${request.id}-${entity.id}`,
            praksisPlaceId: request.praksisPlaceId,
            praksisPlaceName: request.praksisPlaceName,
            departmentId: entity.entityId,
            departmentName: entity.entityName,
            requestedCapacity: entity.requestedQuota,
            approvedCapacity: entity.approvedQuota,
            startDate: request.startDate,
            endDate: request.endDate,
            emne: request.emne,
            studyId: request.studyId,
            programId: request.programId,
            assignedCount,
            availableCount,
            _quotaRequestId: request.id,
            _entityId: entity.entityId,
          });
        }
      } else {
        // Legacy: no entity distributions — treat whole request as one entry
        const approvedCapacity = request.approvedCapacity ?? request.requestedCapacity;
        const assignedCount = students.filter(
          s => s.assignedPraksisPlace?.quotaRequestId === request.id,
        ).length;
        const availableCount = approvedCapacity - assignedCount;
        if (availableCount <= 0) continue;

        result.push({
          id: request.id,
          praksisPlaceId: request.praksisPlaceId,
          praksisPlaceName: request.praksisPlaceName,
          departmentId: request.departmentId,
          departmentName: request.departmentName,
          requestedCapacity: request.requestedCapacity,
          approvedCapacity: request.approvedCapacity,
          startDate: request.startDate,
          endDate: request.endDate,
          emne: request.emne,
          studyId: request.studyId,
          programId: request.programId,
          assignedCount,
          availableCount,
          _quotaRequestId: request.id,
          _entityId: undefined,
        });
      }
    }

    return result;
  };

  // Get available quotas (not yet assigned)
  const getAvailableQuotas = () => {
    return quotas.map((quota) => {
      const assignedCount = students.filter(
        (s) =>
          s.assignedPraksisPlace?.placeId === quota.placeId &&
          s.assignedPraksisPlace?.departmentId ===
            quota.departmentId,
      ).length;

      // Find the unified quota request for this placement + place + department
      const quotaRequest = quotaRequests.find(
        (qr) =>
          qr.placementId === placement.id &&
          qr.praksisPlaceId === quota.placeId &&
          qr.departmentId === quota.departmentId,
      );

      // Get quota values from the unified request
      let pendingRequestQuota = 0;
      let approvedRequestQuota = 0;
      let rejectedRequestQuota = 0;

      if (quotaRequest) {
        // Check the status of the request quota portion
        if (quotaRequest.requestQuotaStatus === "pending") {
          pendingRequestQuota = quotaRequest.requestQuota;
        } else if (
          quotaRequest.requestQuotaStatus === "approved"
        ) {
          approvedRequestQuota = quotaRequest.requestQuota;
        } else if (
          quotaRequest.requestQuotaStatus === "rejected"
        ) {
          rejectedRequestQuota = quotaRequest.requestQuota;
        }
      }

      // Available count = Fixed quota + Approved requests - Assigned
      // (Rejected requests are NOT counted as available)
      const availableCount =
        quota.fixedQuota + approvedRequestQuota - assignedCount;

      return {
        ...quota,
        assignedCount,
        availableCount: Math.max(0, availableCount), // Ensure non-negative
        pendingRequestQuota,
        approvedRequestQuota,
        rejectedRequestQuota,
      };
    });
  };

  const availableQuotas = getAvailableQuotas();

  // Calculate available quotas for AI Auto-Assign based on coordinator quota requests
  // Calculate total available quota
  const totalAvailableQuota = availableQuotas.reduce(
    (sum, q) => sum + q.availableCount,
    0,
  );

  // Check if first publish (task 2/6) is completed
  const isFirstPublishCompleted =
    tasks.find((t) => t.step === "2/6")?.completed || false;

  // Check if all students are assigned
  const allStudentsAssigned =
    students.length > 0 &&
    students.every((s) => s.assignedPraksisPlace);

  // Auto-complete Step 1/6 when both students are imported AND sufficient quotas exist
  useEffect(() => {
    const studentsReady = studentsImported && students.length > 0;
    const quotasReady = students.length > 0 && totalQuotas >= students.length;
    const step1Complete = studentsReady && quotasReady;

    // Only auto-complete, never auto-uncomplete
    if (step1Complete) {
      setTasks((prev) =>
        prev.map((t, idx) =>
          idx === 0 ? { ...t, completed: true } : t,
        ),
      );
    }
  }, [studentsImported, students.length, totalQuotas]);

  // Auto-complete or auto-uncomplete Step 3/6 based on whether all students are assigned
  useEffect(() => {
    if (!studentsImported || students.length === 0) return;
    const allAssigned = students.every((s) => s.assignedPraksisPlace);
    setTasks((prev) =>
      prev.map((t, idx) =>
        idx === 2 ? { ...t, completed: allAssigned } : t,
      ),
    );
  }, [students, studentsImported]);

  // Initialize tasks completion state from initialTaskState (only once)
  useEffect(() => {
    if (
      !hasInitialized.current &&
      initialTaskState?.completedTasks
    ) {
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          completed: initialTaskState.completedTasks.includes(
            t.id,
          ),
        })),
      );
      hasInitialized.current = true;
    }
  }, [initialTaskState]);

  // Auto-import approved coordinator quota requests
  useEffect(() => {
    if (coordinatorQuotaRequests.length > 0 && placement.id) {
      autoImportApprovedQuotaRequests();
    }
  }, [coordinatorQuotaRequests, placement.id]);

  // Store onTaskStateUpdate in a ref to avoid infinite loops
  const onTaskStateUpdateRef = useRef(onTaskStateUpdate);
  useEffect(() => {
    onTaskStateUpdateRef.current = onTaskStateUpdate;
  }, [onTaskStateUpdate]);

  // Sync state back to parent whenever it changes
  useEffect(() => {
    if (onTaskStateUpdateRef.current) {
      const completedTaskIds = tasks
        .filter((t) => t.completed)
        .map((t) => t.id);
      const allStudentsAssigned =
        students.length > 0 &&
        students.every((s) => s.assignedPraksisPlace);

      onTaskStateUpdateRef.current({
        placementId: placement.id,
        studentsImported,
        students,
        quotasSelected: quotas.length > 0,
        quotas,
        firstPublished:
          tasks.find((t) => t.step === "2/6")?.completed ||
          false,
        studentsAssigned: allStudentsAssigned,
        documentsAttached:
          tasks.find((t) => t.step === "4/6")?.completed ||
          false,
        finalPublished:
          tasks.find((t) => t.step === "6/6")?.completed ||
          false,
        completedTasks: completedTaskIds,
        assignmentPublished: isAssignmentPublished,
        assignmentPublishedDate: assignmentPublishedDate ?? undefined,
      });
    }
  }, [students, quotas, studentsImported, tasks, placement.id, isAssignmentPublished, assignmentPublishedDate]);

  // Handle AI Assistant actions
  const handleAIAction = (action: string, data: any) => {
    if (action === "add_quota") {
      // Find the department by name and add quotas
      const departmentName = data.department;
      const quotaCount = data.count;

      // Find a praksis place with this department
      const place = praksisPlaces.find((p) =>
        p.departments.some((d) => d.name === departmentName),
      );

      if (place) {
        const department = place.departments.find(
          (d) => d.name === departmentName,
        );
        if (department) {
          // Check if quota already exists for this department
          const existingQuotaIndex = quotas.findIndex(
            (q) =>
              q.placeId === place.id &&
              q.departmentId === department.id,
          );

          if (existingQuotaIndex >= 0) {
            // Update existing quota
            setQuotas((prev) =>
              prev.map((q, idx) =>
                idx === existingQuotaIndex
                  ? {
                      ...q,
                      fixedQuota: q.fixedQuota + quotaCount,
                    }
                  : q,
              ),
            );
          } else {
            // Add new quota
            const newQuota: QuotaSelection = {
              placeId: place.id,
              placeName: place.name,
              departmentId: department.id,
              departmentName: department.name,
              fixedQuota: quotaCount,
              requestQuota: 0,
            };
            setQuotas((prev) => [...prev, newQuota]);
          }
        }
      }
    } else if (action === "assign_student") {
      // Assign student to department
      const studentData = data.student;
      const departmentName = data.department;

      // Find the department
      const place = praksisPlaces.find((p) =>
        p.departments.some((d) => d.name === departmentName),
      );

      if (place) {
        const department = place.departments.find(
          (d) => d.name === departmentName,
        );
        if (department) {
          handleAssignStudent(
            studentData.id,
            place.id,
            department.id,
            false,
          );
        }
      }
    }
  };

  return (
    <div className="flex h-full w-full">
      {/* Main Content */}
      <div className="flex flex-col flex-1 bg-white min-h-full overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-7 py-6">
          {/* Back Button and Breadcrumbs */}
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
                      {placement.startDate} -{" "}
                      {placement.endDate}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Top-right controls: task chip / edit button + Help */}
            <div className="flex items-center gap-2">
              {/* When published: show Edit button to re-enter edit mode */}
              {isAssignmentPublished ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAssignmentPublished(false)}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800 border-gray-300"
                >
                  <Pencil className="h-4 w-4" />
                  <span className="font-medium">Edit</span>
                </Button>
              ) : (
                /* Compact current-task chip */
                currentTask && placement.status !== "draft" && (
                  <button
                    type="button"
                    onClick={() => setIsTasksModalOpen(true)}
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
                onClick={() => setIsHelpOverlayOpen(true)}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
              >
                <HelpCircle className="h-4 w-4" />
                <span className="font-medium">Help</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Draft Placement Info Banner */}
        {placement.status === "draft" && (
          <div className="px-8 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">
                Welcome! Let's Get Started
              </AlertTitle>
              <AlertDescription className="text-blue-800">
                Fill in the placement details below to create
                your student placement program.
              </AlertDescription>
            </Alert>
          </div>
        )}


        {/* Congratulations Banner - Show when all tasks are completed */}
        {showCongratulations && !currentTask && (
          <div className="px-8 py-4">
            <div className="border rounded-xl p-6 flex items-start gap-4 bg-green-50 border-green-200">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-green-900 text-lg mb-1">
                  🎉 Congratulations! You successfully completed
                  the placement
                </div>
                <div className="text-sm text-green-700">
                  All tasks have been completed and the
                  placement has been published. Students will be
                  notified of their assignments.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white">
          {placement.status === "draft" ? (
            // Metadata Form for Draft Placements
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Placement Details
                  </h2>
                  <p className="text-sm text-gray-600">
                    Fill in the basic information to get started
                    with your student placement program.
                  </p>
                </div>

                <form
                  onSubmit={handleMetadataFormSubmit}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="font-medium text-gray-700 text-sm block">
                      Study *
                    </label>
                    <Select
                      value={metadataFormData.studyId}
                      onValueChange={(value) =>
                        setMetadataFormData({
                          ...metadataFormData,
                          studyId: value,
                          programId: "",
                        })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select a study" />
                      </SelectTrigger>
                      <SelectContent>
                        {studies.map((study) => (
                          <SelectItem
                            key={study.id}
                            value={study.id}
                          >
                            {study.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium text-gray-700 text-sm block">
                      Study Program *
                    </label>
                    <Select
                      value={metadataFormData.programId}
                      onValueChange={(value) =>
                        setMetadataFormData({
                          ...metadataFormData,
                          programId: value,
                        })
                      }
                      disabled={!metadataFormData.studyId}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Select a program" />
                      </SelectTrigger>
                      <SelectContent>
                        {metadataFormData.studyId &&
                          studies
                            .find(
                              (s) =>
                                s.id ===
                                metadataFormData.studyId,
                            )
                            ?.programs.map((program) => (
                              <SelectItem
                                key={program.id}
                                value={program.id}
                              >
                                {program.name}
                              </SelectItem>
                            ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium text-gray-700 text-sm block">
                      Emne (Subject) *
                    </label>
                    <Input
                      value={metadataFormData.subject}
                      onChange={(e) =>
                        setMetadataFormData({
                          ...metadataFormData,
                          subject: e.target.value,
                        })
                      }
                      placeholder="e.g., Clinical Practice"
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="font-medium text-gray-700 text-sm block">
                        Start Date *
                      </label>
                      <div className="relative">
                        <Input
                          ref={startDateInputRef}
                          type="date"
                          value={metadataFormData.startDate}
                          onChange={(e) => {
                            const startDate = e.target.value;
                            const date = new Date(startDate);
                            const year = date.getFullYear().toString();
                            const month = date.getMonth(); // 0-indexed (0=Jan, 7=Aug)
                            const semester = month < 7 ? "Spring" : "Autumn";
                            
                            // Validate against end date
                            if (metadataFormData.endDate && startDate && startDate >= metadataFormData.endDate) {
                              setDateValidationError("Start date must be before end date");
                            } else {
                              setDateValidationError("");
                            }
                            
                            setMetadataFormData({
                              ...metadataFormData,
                              startDate,
                              year,
                              semester,
                            });
                          }}
                          className={`h-10 text-gray-900 [color-scheme:light] ${dateValidationError ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="font-medium text-gray-700 text-sm block">
                        End Date *
                      </label>
                      <div className="relative">
                        <Input
                          ref={endDateInputRef}
                          type="date"
                          value={metadataFormData.endDate}
                          onChange={(e) => {
                            const endDate = e.target.value;
                            
                            // Validate against start date
                            if (metadataFormData.startDate && endDate && endDate <= metadataFormData.startDate) {
                              setDateValidationError("End date must be after start date");
                            } else {
                              setDateValidationError("");
                            }
                            
                            setMetadataFormData({
                              ...metadataFormData,
                              endDate,
                            });
                          }}
                          className={`h-10 text-gray-900 [color-scheme:light] ${dateValidationError ? 'border-red-500' : ''}`}
                          required
                        />
                      </div>
                      {dateValidationError && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <XCircle className="h-4 w-4" />
                          {dateValidationError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-medium text-gray-700 text-sm block">
                      Placement title *
                    </label>
                    <Input
                      value={metadataFormData.title}
                      onChange={(e) =>
                        setMetadataFormData({
                          ...metadataFormData,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g., Spring 2026 Nursing Placement"
                      className="h-10"
                      required
                    />
                  </div>

                  <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelDraft}
                      className="px-6 h-10"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="px-6 h-10 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save and Continue
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="space-y-4 pt-6">
              {/* Validation Alerts - full width */}
              {!isStudentsExpanded && students.length > 0 && totalQuotas < students.length && !allStudentsAssigned && (
                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-900">
                    Insufficient Quotas
                  </AlertTitle>
                  <AlertDescription className="text-amber-800">
                    You have {students.length} students but only {totalQuotas} quota{totalQuotas !== 1 ? 's' : ''}.
                    Add {students.length - totalQuotas} more quota{students.length - totalQuotas !== 1 ? 's' : ''} to complete this step.
                  </AlertDescription>
                </Alert>
              )}

              {totalQuotas > 0 && students.length === 0 && (
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">
                    Import Students
                  </AlertTitle>
                  <AlertDescription className="text-blue-800">
                    You have allocated {totalQuotas} quota{totalQuotas !== 1 ? 's' : ''}. Import students to continue with the placement process.
                  </AlertDescription>
                </Alert>
              )}

              {/* Assignment publish banner — shown when all students are assigned */}
              {studentsImported && allStudentsAssigned && students.length > 0 && (
                <div className={`border rounded-xl p-4 flex items-center justify-between ${
                  isAssignmentPublished
                    ? "bg-green-50 border-green-200"
                    : "bg-green-50 border-green-300"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-green-900">
                        {isAssignmentPublished
                          ? "Assignments published"
                          : "All students assigned — ready to publish"}
                      </div>
                      <div className="text-sm text-green-700 mt-0.5">
                        {isAssignmentPublished
                          ? `Published on ${assignmentPublishedDate}`
                          : "Publishing will lock all assignments and notify the praksis places."}
                      </div>
                    </div>
                  </div>
                  {!isAssignmentPublished && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {wasEverPublished && (
                        <Button
                          variant="outline"
                          onClick={() => setIsAssignmentPublished(true)}
                          className="border-gray-300 text-gray-600 hover:bg-gray-50"
                        >
                          Cancel edit
                        </Button>
                      )}
                      <Button
                        onClick={() => setIsPublishConfirmOpen(true)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Publish assignments
                      </Button>
                    </div>
                  )}
                  {isAssignmentPublished && (
                    <div className="flex items-center gap-1.5 text-green-700 text-sm flex-shrink-0">
                      <CheckCircle className="h-4 w-4" />
                      <span className="font-medium">Published</span>
                    </div>
                  )}
                </div>
              )}

              {/* Split panel: quotas on the left, students on the right */}
              <div className="flex gap-4 items-start">

                {/* LEFT PANEL: Available Quotas — sticky sidebar */}
                {!isStudentsExpanded && <div className="w-[400px] flex-shrink-0 sticky top-6 max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg border border-gray-200 bg-white">
                  <AvailableQuotasTable
                    coordinatorQuotaRequests={coordinatorQuotaRequests}
                    students={students}
                    praksisPlaces={praksisPlaces}
                    placementId={placement.id}
                    studyId={metadataFormData.studyId || placement.studyId}
                    programId={metadataFormData.programId || placement.programId}
                    emne={metadataFormData.emne || placement.emne}
                    startDate={metadataFormData.startDate || placement.startDate}
                    endDate={metadataFormData.endDate || placement.endDate}
                    isPublished={isFirstPublishCompleted}
                    readOnly={isAssignmentPublished}
                    onQuickAssign={handleQuickAssign}
                    onRequestMoreQuotas={handleRequestMoreQuotas}
                    onApproveRequest={handleApproveRequest}
                    onEditRequest={handleEditRequest}
                    onDeleteRequest={handleDeleteRequest}
                  />
                </div>}{/* end LEFT PANEL */}

                {/* RIGHT PANEL: Students */}
                <div className="flex-1 min-w-0">
                {!studentsImported ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-200">
                  <div className="text-center max-w-md">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      No students imported yet
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Import students to start managing placements
                      and assignments.
                    </p>
                    <Button
                      onClick={handleImportStudents}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Import Students
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Students Table */}
                  <div className="bg-white rounded-lg border border-gray-200">
                {/* Table Header Actions */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-800">Students</h3>
                      {students.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowUnassignedOnly(!showUnassignedOnly)}
                          className={`text-xs px-2.5 py-0.5 rounded-full border transition-colors ${
                            showUnassignedOnly
                              ? 'bg-amber-100 border-amber-300 text-amber-700 font-medium'
                              : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {showUnassignedOnly ? 'Showing unassigned only' : 'Show unassigned only'}
                        </button>
                      )}
                      {/* Search field */}
                      {students.length > 0 && (
                        <div className="relative">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                          <input
                            type="text"
                            placeholder="Search students…"
                            value={studentSearch}
                            onChange={(e) => setStudentSearch(e.target.value)}
                            className="h-6 pl-7 pr-6 text-xs border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 w-44"
                          />
                          {studentSearch && (
                            <button
                              onClick={() => setStudentSearch('')}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {students.length > 0 && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${(students.filter(s => s.assignedPraksisPlace).length / students.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">
                          {students.filter(s => s.assignedPraksisPlace).length} / {students.length} assigned
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {/* Network Diagram Button */}
                    {!isAssignmentPublished && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setIsNetworkDiagramOpen(true)
                      }
                      className="flex items-center gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-300"
                    >
                      <Network className="h-4 w-4" />
                      Diagram
                    </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>

                    {/* Column Visibility Toggle */}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setIsColumnMenuOpen(!isColumnMenuOpen)
                        }
                        className="flex items-center gap-2"
                      >
                        <Columns3 className="h-4 w-4" />
                        Columns
                      </Button>

                      {isColumnMenuOpen && (
                        <>
                          {/* Backdrop to close menu */}
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() =>
                              setIsColumnMenuOpen(false)
                            }
                          />

                          {/* Column Menu */}
                          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                            <div className="p-3 border-b border-gray-200">
                              <h4 className="text-sm font-semibold text-gray-800">
                                Show Columns
                              </h4>
                            </div>
                            <div className="p-2">
                              <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                  checked={
                                    visibleColumns.student
                                  }
                                  onCheckedChange={() =>
                                    toggleColumn("student")
                                  }
                                />
                                <span className="text-sm text-gray-700">
                                  Student
                                </span>
                              </label>
                              <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                  checked={
                                    visibleColumns.placementHistory
                                  }
                                  onCheckedChange={() =>
                                    toggleColumn(
                                      "placementHistory",
                                    )
                                  }
                                />
                                <span className="text-sm text-gray-700">
                                  Placement History
                                </span>
                              </label>
                              <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                  checked={
                                    visibleColumns.assignedPlace
                                  }
                                  onCheckedChange={() =>
                                    toggleColumn(
                                      "assignedPlace",
                                    )
                                  }
                                />
                                <span className="text-sm text-gray-700">
                                  Assigned Praksis Place
                                </span>
                              </label>
                              <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                  checked={
                                    visibleColumns.supervisor
                                  }
                                  onCheckedChange={() =>
                                    toggleColumn("supervisor")
                                  }
                                />
                                <span className="text-sm text-gray-700">
                                  Supervisor
                                </span>
                              </label>
                              <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                  checked={
                                    visibleColumns.priorities
                                  }
                                  onCheckedChange={() =>
                                    toggleColumn("priorities")
                                  }
                                />
                                <span className="text-sm text-gray-700">
                                  Priorities
                                </span>
                              </label>
                              <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                  checked={
                                    visibleColumns.customRequest
                                  }
                                  onCheckedChange={() =>
                                    toggleColumn(
                                      "customRequest",
                                    )
                                  }
                                />
                                <span className="text-sm text-gray-700">
                                  Custom Request
                                </span>
                              </label>
                              <label className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer transition-colors">
                                <Checkbox
                                  checked={
                                    visibleColumns.attachFiles
                                  }
                                  onCheckedChange={() =>
                                    toggleColumn("attachFiles")
                                  }
                                />
                                <span className="text-sm text-gray-700">
                                  Attach Files
                                </span>
                              </label>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Expand / collapse sidebar */}
                    <button
                      type="button"
                      onClick={() => setIsStudentsExpanded((v) => !v)}
                      title={isStudentsExpanded ? "Collapse — show quotas panel" : "Expand — hide quotas panel"}
                      className="p-1.5 rounded-md border border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      {isStudentsExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>

                    {/* Actions Dropdown */}
                    {!isAssignmentPublished && <div className="relative">
                      <Button
                        size="sm"
                        disabled={selectedStudents.size === 0}
                        onClick={() =>
                          setIsActionsDropdownOpen(
                            !isActionsDropdownOpen,
                          )
                        }
                        className={`flex items-center gap-2 ${
                          selectedStudents.size === 0
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        Actions
                        <ChevronDown className="h-4 w-4" />
                      </Button>

                      {/* Dropdown Menu */}
                      {isActionsDropdownOpen &&
                        selectedStudents.size > 0 && (
                          <>
                            {/* Backdrop to close dropdown */}
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() =>
                                setIsActionsDropdownOpen(false)
                              }
                            />

                            {/* Menu */}
                            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                              <button
                                onClick={() => {
                                  // Open file picker for bulk file attachment
                                  const input =
                                    document.createElement(
                                      "input",
                                    );
                                  input.type = "file";
                                  input.multiple = true;
                                  input.onchange = (
                                    e: Event,
                                  ) => {
                                    const target =
                                      e.target as HTMLInputElement;
                                    const files = target.files;
                                    if (
                                      files &&
                                      files.length > 0
                                    ) {
                                      // Attach files to all selected students
                                      const selectedStudentIds =
                                        Array.from(
                                          selectedStudents,
                                        );
                                      const newFilesPerStudent =
                                        Array.from(files).map(
                                          (file, idx) => ({
                                            name: file.name,
                                            size: file.size,
                                            uploadedAt:
                                              new Date().toISOString(),
                                          }),
                                        );

                                      setStudents((prev) =>
                                        prev.map((s) =>
                                          selectedStudentIds.includes(
                                            s.id,
                                          )
                                            ? {
                                                ...s,
                                                attachedFiles: [
                                                  ...(s.attachedFiles ||
                                                    []),
                                                  ...newFilesPerStudent.map(
                                                    (
                                                      file,
                                                      idx,
                                                    ) => ({
                                                      ...file,
                                                      id: `${s.id}-file-${Date.now()}-${idx}`,
                                                    }),
                                                  ),
                                                ],
                                              }
                                            : s,
                                        ),
                                      );
                                    }
                                  };
                                  input.click();
                                  setIsActionsDropdownOpen(
                                    false,
                                  );
                                }}
                                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                              >
                                <Paperclip className="h-4 w-4 text-gray-500" />
                                <div>
                                  <div className="font-medium">
                                    Attach files to students
                                  </div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    Add file(s) to{" "}
                                    {selectedStudents.size}{" "}
                                    student
                                    {selectedStudents.size !== 1
                                      ? "s"
                                      : ""}
                                  </div>
                                </div>
                              </button>
                            </div>
                          </>
                        )}
                    </div>}
                  </div>
                </div>

                {/* Students Table */}
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-2 py-3 text-left w-12">
                        <Checkbox
                          checked={
                            selectedStudents.size ===
                              students.length &&
                            students.length > 0
                          }
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents(
                                new Set(
                                  students.map((s) => s.id),
                                ),
                              );
                            } else {
                              setSelectedStudents(new Set());
                            }
                          }}
                        />
                      </th>
                      {visibleColumns.student && (
                        <th
                          className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                          onClick={() => setStudentSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc')}
                        >
                          <div className="flex items-center gap-1">
                            Student
                            {studentSortDir === 'asc'  ? <ChevronUp    className="h-3.5 w-3.5 text-blue-500" /> :
                             studentSortDir === 'desc' ? <ChevronDown   className="h-3.5 w-3.5 text-blue-500" /> :
                                                         <ArrowUpDown   className="h-3.5 w-3.5 text-gray-400" />}
                          </div>
                        </th>
                      )}
                      {visibleColumns.placementHistory && (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Placement History
                        </th>
                      )}
                      {visibleColumns.assignedPlace && (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 w-64">
                          Praksis Place
                        </th>
                      )}
                      {visibleColumns.supervisor && (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Supervisor
                        </th>
                      )}
                      {visibleColumns.priorities && (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Priorities
                        </th>
                      )}
                      {visibleColumns.customRequest && (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Custom Request
                        </th>
                      )}
                      {visibleColumns.attachFiles && (
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                          Attach Files
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {students
                      .filter(s => !showUnassignedOnly || !s.assignedPraksisPlace)
                      .filter(s => !studentSearch.trim() || s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                      .sort((a, b) =>
                        studentSortDir === 'asc'  ?  a.name.localeCompare(b.name) :
                        studentSortDir === 'desc' ?  b.name.localeCompare(a.name) : 0
                      )
                      .map((student) => (
                      <tr
                        key={student.id}
                        className={`border-b border-gray-100 transition-colors ${
                          student.assignedPraksisPlace
                            ? 'bg-green-50/50 opacity-60 hover:opacity-80 hover:bg-green-50'
                            : 'hover:bg-blue-50/40'
                        }`}
                      >
                        <td className="px-2 py-4">
                          <Checkbox
                            checked={selectedStudents.has(
                              student.id,
                            )}
                            onCheckedChange={() =>
                              handleToggleStudentSelection(
                                student.id,
                              )
                            }
                          />
                        </td>
                        {visibleColumns.student && (
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-gray-800">
                                {student.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {student.email}
                              </div>
                            </div>
                          </td>
                        )}
                        {visibleColumns.placementHistory && (
                          <td className="px-4 py-4">
                            {student.placementHistory &&
                            student.placementHistory.length >
                              0 ? (
                              <div className="space-y-1">
                                {(() => {
                                  const isExpanded =
                                    expandedPlacementHistory.has(
                                      student.id,
                                    );
                                  const displayPlacements =
                                    isExpanded
                                      ? student.placementHistory
                                      : student.placementHistory.slice(
                                          -2,
                                        );

                                  return (
                                    <>
                                      {displayPlacements.map(
                                        (placement) => {
                                          const statusColor =
                                            placement.status === "current"
                                              ? "border-l-blue-400 bg-blue-50"
                                              : placement.status === "upcoming"
                                              ? "border-l-green-400 bg-green-50"
                                              : "border-l-gray-300 bg-gray-50";
                                          const textColor =
                                            placement.status === "current"
                                              ? "text-blue-800"
                                              : placement.status === "upcoming"
                                              ? "text-green-800"
                                              : "text-gray-600";
                                          const topLine = [
                                            placement.year,
                                            placement.semester,
                                            placement.emne,
                                          ]
                                            .filter(Boolean)
                                            .join(" / ");
                                          const placeLabel = placement.unitName
                                            ? `${placement.praksisPlaceName} / ${placement.unitName}`
                                            : placement.praksisPlaceName;
                                          const isConflict =
                                            placement.praksisPlaceName &&
                                            placement.unitName &&
                                            quotaEntityKeys.has(
                                              `${placement.praksisPlaceName.toLowerCase()}|${placement.unitName.toLowerCase()}`
                                            );
                                          return (
                                            <div
                                              key={placement.placementId}
                                              className={`border-l-2 pl-2 py-0.5 rounded-sm ${statusColor}`}
                                            >
                                              <div className={`text-xs font-medium ${textColor} flex items-center gap-1`}>
                                                {isConflict && (
                                                  <span title="Student has already been placed at this entity">
                                                    <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
                                                  </span>
                                                )}
                                                {topLine}
                                              </div>
                                              {placeLabel && (
                                                <div
                                                  className="text-xs text-gray-500 truncate max-w-[200px]"
                                                  title={placeLabel}
                                                >
                                                  {placeLabel}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        },
                                      )}
                                      {student.placementHistory
                                        .length > 2 && (
                                        <button
                                          onClick={() =>
                                            togglePlacementHistory(
                                              student.id,
                                            )
                                          }
                                          className="text-xs text-blue-600 hover:text-blue-700 hover:underline mt-0.5"
                                        >
                                          {isExpanded
                                            ? "Show less"
                                            : `Show ${student.placementHistory.length - 2} more`}
                                        </button>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                No history
                              </span>
                            )}
                          </td>
                        )}
                        {visibleColumns.assignedPlace && (
                          <td className="px-4 py-4">
                            {student.assignedPraksisPlace ? (
                              <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-800 text-[12px]">
                                      {
                                        student
                                          .assignedPraksisPlace
                                          .placeName
                                      }
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {
                                        student
                                          .assignedPraksisPlace
                                          .departmentName
                                      }
                                    </div>
                                    {student
                                      .assignedPraksisPlace
                                      .approvalRequested && (
                                      <Badge
                                        variant="outline"
                                        className={`mt-1 text-xs ${
                                          student
                                            .assignedPraksisPlace
                                            .approvalStatus ===
                                          "pending"
                                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                            : student
                                                  .assignedPraksisPlace
                                                  .approvalStatus ===
                                                "approved"
                                              ? "bg-green-50 text-green-700 border-green-200"
                                              : "bg-red-50 text-red-700 border-red-200"
                                        }`}
                                      >
                                        {student
                                          .assignedPraksisPlace
                                          .approvalStatus ===
                                          "pending" &&
                                          "⏳ Approval pending"}
                                        {student
                                          .assignedPraksisPlace
                                          .approvalStatus ===
                                          "approved" &&
                                          "✓ Approved"}
                                        {student
                                          .assignedPraksisPlace
                                          .approvalStatus ===
                                          "rejected" &&
                                          "✗ Rejected"}
                                      </Badge>
                                    )}
                                  </div>
                                  {!isAssignmentPublished && (
                                    <Badge
                                      variant="outline"
                                      className="bg-red-50 text-red-600 border-red-200 text-xs cursor-pointer hover:bg-red-100"
                                      onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        setStudents((prev) =>
                                          prev.map((s) =>
                                            s.id === student.id
                                              ? { ...s, assignedPraksisPlace: undefined }
                                              : s,
                                          ),
                                        );
                                        toast.success(`${student.name} detached from praksis place`);
                                      }}
                                    >
                                      Detach
                                    </Badge>
                                  )}
                                </div>
                            ) : (
                              !isAssignmentPublished && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (!isFirstPublishCompleted) {
                                    setShowPublishWarning(true);
                                  } else {
                                    setSelectedStudent(student);
                                    setIsQuotaSelectionDialogOpen(true);
                                  }
                                }}
                                className="text-blue-600 border-blue-300 hover:bg-blue-50"
                              >
                                Add praksis place
                              </Button>
                              )
                            )}
                          </td>
                        )}
                        {visibleColumns.supervisor && (
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-600">
                              {student.supervisor
                                ? student.supervisor.name
                                : "Not assigned"}
                            </span>
                          </td>
                        )}
                        {visibleColumns.priorities && (
                          <td className="px-4 py-4">
                            <span className="text-sm text-gray-600">
                              {student.priorities || "Not set"}
                            </span>
                          </td>
                        )}
                        {visibleColumns.customRequest && (
                          <td className="px-4 py-4">
                            {student.customRequest ? (
                              <div className="max-w-xs">
                                <div className="font-medium text-sm text-gray-800 mb-1">
                                  Preferred:{" "}
                                  {
                                    student.customRequest
                                      .preferredPlaceName
                                  }
                                </div>
                                <div className="text-xs text-gray-600 line-clamp-2">
                                  {
                                    student.customRequest
                                      .message
                                  }
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Submitted:{" "}
                                  {new Date(
                                    student.customRequest.submittedAt,
                                  ).toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">
                                {student.customRequestSubmitted
                                  ? "Submitted"
                                  : "Not submitted yet"}
                              </span>
                            )}
                          </td>
                        )}
                        {visibleColumns.attachFiles && (
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {student.attachedFiles &&
                              student.attachedFiles.length >
                                0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="flex gap-1">
                                    {student.attachedFiles.map(
                                      (file) => (
                                        <div
                                          key={file.id}
                                          className="relative group"
                                        >
                                          <div
                                            className="w-9 h-9 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center cursor-pointer hover:bg-blue-200 transition-colors"
                                            title={file.name}
                                          >
                                            <File className="h-4 w-4 text-blue-600" />
                                          </div>

                                          {/* Hover Tooltip with File Info and Remove */}
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-10">
                                            <div className="bg-gray-900 text-white rounded-lg shadow-lg p-3 w-64">
                                              {/* File name */}
                                              <div className="font-medium text-sm mb-1 break-words">
                                                {file.name}
                                              </div>
                                              {/* File size */}
                                              <div className="text-xs text-gray-300 mb-2">
                                                {(
                                                  file.size /
                                                  1024
                                                ).toFixed(
                                                  1,
                                                )}{" "}
                                                KB
                                              </div>
                                              {/* Remove button */}
                                              <button
                                                onClick={(
                                                  e,
                                                ) => {
                                                  e.stopPropagation();
                                                  setStudents(
                                                    (prev) =>
                                                      prev.map(
                                                        (s) =>
                                                          s.id ===
                                                          student.id
                                                            ? {
                                                                ...s,
                                                                attachedFiles:
                                                                  s.attachedFiles?.filter(
                                                                    (
                                                                      f,
                                                                    ) =>
                                                                      f.id !==
                                                                      file.id,
                                                                  ),
                                                              }
                                                            : s,
                                                      ),
                                                  );
                                                }}
                                                className="w-full bg-red-600 hover:bg-red-700 text-white text-xs py-1.5 px-3 rounded flex items-center justify-center gap-1 transition-colors"
                                              >
                                                <Trash2 className="h-3 w-3" />
                                                Remove
                                              </button>
                                              {/* Arrow */}
                                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
                                                <div className="border-4 border-transparent border-t-gray-900"></div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ),
                                    )}
                                    {/* Totals Row */}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const input =
                                        document.createElement(
                                          "input",
                                        );
                                      input.type = "file";
                                      input.multiple = true;
                                      input.onchange = (
                                        e: Event,
                                      ) => {
                                        const target =
                                          e.target as HTMLInputElement;
                                        const files =
                                          target.files;
                                        if (
                                          files &&
                                          files.length > 0
                                        ) {
                                          const newFiles =
                                            Array.from(
                                              files,
                                            ).map(
                                              (file, idx) => ({
                                                id: `${student.id}-file-${Date.now()}-${idx}`,
                                                name: file.name,
                                                size: file.size,
                                                uploadedAt:
                                                  new Date().toISOString(),
                                              }),
                                            );
                                          setStudents((prev) =>
                                            prev.map((s) =>
                                              s.id ===
                                              student.id
                                                ? {
                                                    ...s,
                                                    attachedFiles:
                                                      [
                                                        ...(s.attachedFiles ||
                                                          []),
                                                        ...newFiles,
                                                      ],
                                                  }
                                                : s,
                                            ),
                                          );
                                        }
                                      };
                                      input.click();
                                    }}
                                    className="text-xs"
                                  >
                                    <Paperclip className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const input =
                                      document.createElement(
                                        "input",
                                      );
                                    input.type = "file";
                                    input.multiple = true;
                                    input.onchange = (
                                      e: Event,
                                    ) => {
                                      const target =
                                        e.target as HTMLInputElement;
                                      const files =
                                        target.files;
                                      if (
                                        files &&
                                        files.length > 0
                                      ) {
                                        const newFiles =
                                          Array.from(files).map(
                                            (file, idx) => ({
                                              id: `${student.id}-file-${Date.now()}-${idx}`,
                                              name: file.name,
                                              size: file.size,
                                              uploadedAt:
                                                new Date().toISOString(),
                                            }),
                                          );
                                        setStudents((prev) =>
                                          prev.map((s) =>
                                            s.id === student.id
                                              ? {
                                                  ...s,
                                                  attachedFiles:
                                                    newFiles,
                                                }
                                              : s,
                                          ),
                                        );
                                      }
                                    };
                                    input.click();
                                  }}
                                  className="text-blue-600 border-blue-300 hover:bg-blue-50 flex items-center gap-1"
                                >
                                  <Upload className="h-4 w-4" />
                                  Attach
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    </tbody>
                </table>
                </div>{/* end overflow-x-auto */}
              </div>
                </>
            )}
                </div>{/* end RIGHT PANEL: Students */}

              </div>{/* end SPLIT PANEL */}
            </div>
          )}
        </div>

        {/* Modals */}
        <PlacementTasksModal
          isOpen={isTasksModalOpen}
          onClose={() => setIsTasksModalOpen(false)}
          tasks={tasks}
          onTaskAction={handleTaskAction}
        />

        {/* Publish assignments confirm dialog */}
        <Dialog open={isPublishConfirmOpen} onOpenChange={setIsPublishConfirmOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Publish assignments?</DialogTitle>
              <DialogDescription>
                Publishing will lock all student assignments. Detach and reassign actions will be disabled and quota request actions will be read-only. This cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsPublishConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  const now = new Date().toLocaleString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  });
                  setIsAssignmentPublished(true);
                  setWasEverPublished(true);
                  setAssignmentPublishedDate(now);
                  setIsPublishConfirmOpen(false);
                  toast.success('Assignments published successfully');
                }}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish assignments
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Assign Modal - from Available Quotas Table */}
        {selectedQuotaForAssignment && (
          <QuickAssignStudentsModal
            isOpen={isQuickAssignModalOpen}
            onClose={() => {
              setIsQuickAssignModalOpen(false);
              setSelectedQuotaForAssignment(null);
            }}
            praksisPlaceName={selectedQuotaForAssignment.praksisPlaceName}
            departmentName={selectedQuotaForAssignment.departmentName}
            availableCapacity={selectedQuotaForAssignment.availableCapacity}
            unassignedStudents={students.filter(s => !s.assignedPraksisPlace)}
            onAssign={(studentIds) => {
              console.log('[QuickAssign] Assigning students:', studentIds);
              console.log('[QuickAssign] Quota info:', selectedQuotaForAssignment);
              
              // Assign all selected students to the same place/department/entity
              studentIds.forEach(studentId => {
                console.log('[QuickAssign] Assigning student:', studentId, 'to place:', selectedQuotaForAssignment.praksisPlaceId, 'dept:', selectedQuotaForAssignment.departmentId, 'entity:', selectedQuotaForAssignment.entityId, 'request:', selectedQuotaForAssignment.requestId);
                handleAssignStudent(
                  studentId,
                  selectedQuotaForAssignment.praksisPlaceId,
                  selectedQuotaForAssignment.departmentId,
                  false,
                  selectedQuotaForAssignment.requestId, // Link to specific quota request
                  selectedQuotaForAssignment.entityId // Link to specific entity (for multi-entity requests)
                );
              });
              
              // Show success toast
              const count = studentIds.length;
              toast.success(
                `Successfully assigned ${count} student${count !== 1 ? 's' : ''} to ${selectedQuotaForAssignment.praksisPlaceName} - ${selectedQuotaForAssignment.departmentName}`
              );
              
              setIsQuickAssignModalOpen(false);
              setSelectedQuotaForAssignment(null);
            }}
          />
        )}

        {/* Quota Selection Dialog - for assigning a single student */}
        <Dialog open={isQuotaSelectionDialogOpen} onOpenChange={setIsQuotaSelectionDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select Praksis Place</DialogTitle>
              <DialogDescription>
                Choose an available quota request to assign{' '}
                <span className="font-semibold">{selectedStudent?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              {(() => {
                const availableRequests = getAvailableQuotaRequests();
                
                if (availableRequests.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-sm">No available quota requests found</p>
                      <p className="text-xs mt-1">
                        Request quotas from the Capacity Planning page first
                      </p>
                    </div>
                  );
                }

                return availableRequests.map((request) => {
                  const conflictHistory = (selectedStudent?.placementHistory ?? []).filter(
                    (h) =>
                      h.praksisPlaceName?.toLowerCase() === request.praksisPlaceName.toLowerCase() &&
                      h.unitName?.toLowerCase() === request.departmentName.toLowerCase()
                  );
                  const hasConflict = conflictHistory.length > 0;

                  return (
                  <button
                    key={request.id}
                    onClick={() => {
                      if (selectedStudent) {
                        handleAssignStudent(
                          selectedStudent.id,
                          request.praksisPlaceId,
                          request.departmentId,
                          false,
                          request._quotaRequestId,
                          request._entityId,
                        );
                        toast.success(
                          `Assigned ${selectedStudent.name} to ${request.praksisPlaceName} - ${request.departmentName}`
                        );
                        setIsQuotaSelectionDialogOpen(false);
                        setSelectedStudent(null);
                      }
                    }}
                    className={`w-full p-4 border rounded-lg transition-all text-left group ${
                      hasConflict
                        ? 'border-amber-300 bg-amber-50 hover:border-amber-400'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-gray-900">
                            {request.praksisPlaceName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-gray-600 ml-6">
                          {hasConflict && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                          )}
                          {request.departmentName}
                        </div>
                        {request.emne && (
                          <div className="text-xs text-gray-500 ml-6 mt-1 italic">
                            Emne: {request.emne}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            {new Date(request.startDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}{' '}
                            -{' '}
                            {new Date(request.endDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {/* Conflict history records */}
                        {hasConflict && (
                          <div className="mt-2 ml-6 space-y-1">
                            {conflictHistory.map((h) => {
                              const statusColor =
                                h.status === 'current'
                                  ? 'border-l-blue-400 bg-blue-50 text-blue-700'
                                  : h.status === 'upcoming'
                                  ? 'border-l-green-400 bg-green-50 text-green-700'
                                  : 'border-l-amber-400 bg-amber-100 text-amber-800';
                              const label =
                                h.status === 'current' ? 'Current' :
                                h.status === 'upcoming' ? 'Upcoming' : 'Previous';
                              const topLine = [h.year, h.semester, h.emne]
                                .filter(Boolean)
                                .join(' / ');
                              return (
                                <div
                                  key={h.placementId}
                                  className={`border-l-2 pl-2 py-0.5 rounded-sm ${statusColor}`}
                                >
                                  <div className="text-xs font-medium">
                                    {label} · {topLine}
                                  </div>
                                  <div className="text-xs opacity-70">
                                    {h.praksisPlaceName}
                                    {h.unitName && ` / ${h.unitName}`}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          {request.availableCount} available
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {request.assignedCount} / {request.approvedCapacity ?? request.requestedCapacity} assigned
                        </span>
                      </div>
                    </div>
                  </button>
                  );
                });
              })()}
            </div>
          </DialogContent>
        </Dialog>

        <SlideOverManageQuota
          isOpen={isManageQuotaModalOpen}
          onClose={() => setIsManageQuotaModalOpen(false)}
          praksisPlaces={praksisPlaces}
          onSaveQuotas={handleSaveQuotas}
          existingQuotas={quotas}
        />

        {/* Request Quota Modal */}
        <RequestQuotaModal
          isOpen={isRequestQuotaModalOpen}
          onClose={() => {
            setIsRequestQuotaModalOpen(false);
            setEditingQuotaRequest(null);
          }}
          onSubmit={handleRequestQuotaSubmit}
          placement={{
            id: placement.id,
            studyId: placement.studyId || metadataFormData.studyId,
            studyName: studies.find(s => s.id === (placement.studyId || metadataFormData.studyId))?.name || '',
            programId: placement.programId || metadataFormData.programId,
            programName: studies.find(s => s.id === (placement.studyId || metadataFormData.studyId))?.programs.find(p => p.id === (placement.programId || metadataFormData.programId))?.name || '',
            universityId: 'U1',
            universityName: 'University of Oslo',
            startDate: placement.startDate || metadataFormData.startDate,
            endDate: placement.endDate || metadataFormData.endDate,
          }}
          existingQuotas={quotas.map(q => ({
            praksisPlaceId: q.praksisPlaceId || q.placeId,
            praksisPlaceName: q.praksisPlaceName || q.placeName,
            departmentId: q.departmentId,
            departmentName: q.departmentName,
          }))}
          praksisPlaces={praksisPlaces}
          currentUserName={currentUserName}
          existingRequests={coordinatorQuotaRequests.filter(
            req => req.placementId === placement.id
          )}
          editingRequest={editingQuotaRequest || undefined}
          onUpdate={handleUpdateQuotaRequest}
        />

      </div>

      {/* AI Support Sidebar */}
      <AISupportSidebar
        isOpen={isAISidebarOpen}
        onClose={() => onAISidebarChange?.(false)}
        onExecuteAction={handleAIAction}
        availableDepartments={availableQuotas}
        students={students}
        tasks={tasks.map((t) => ({
          id: t.id,
          title: t.title,
          completed: t.completed,
        }))}
        currentTaskIndex={
          tasks.findIndex((t) => !t.completed) >= 0
            ? tasks.findIndex((t) => !t.completed)
            : tasks.length - 1
        }
      />

      {/* First Publish Modal */}
      <FirstPublishModal
        isOpen={isFirstPublishModalOpen}
        onClose={() => setIsFirstPublishModalOpen(false)}
        onPublish={handleFirstPublish}
      />

      {/* Publish Warning Dialog */}
      <Dialog open={showPublishWarning} onOpenChange={setShowPublishWarning}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Placement First</DialogTitle>
            <DialogDescription className="text-base pt-2">
              You should publish placement to collect custom requests from students. Use publish button located above.
              <br /><br />
              <strong>Note:</strong> This is the default workflow for demo. In real app you will be able to change the workflow.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => setShowPublishWarning(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Placement Network Diagram Modal */}
      <PlacementNetworkDiagramModal
        isOpen={isNetworkDiagramOpen}
        onClose={() => setIsNetworkDiagramOpen(false)}
        students={students.map((s) => ({
          id: s.id,
          name: s.name,
          assignedPlace: s.assignedPraksisPlace
            ? {
                placeId: s.assignedPraksisPlace.placeId,
                placeName: s.assignedPraksisPlace.placeName,
                departmentId: s.assignedPraksisPlace.departmentId,
                departmentName: s.assignedPraksisPlace.departmentName,
                quotaRequestId: s.assignedPraksisPlace.quotaRequestId,
                entityId: s.assignedPraksisPlace.entityId,
              }
            : undefined,
        }))}
        quotas={(coordinatorQuotaRequests || [])
          .filter((req) => {
            // Same filtering logic as AvailableQuotasTable
            
            // Filter 1: Match study + program
            if (
              req.studyId !== (metadataFormData.studyId || placement.studyId) ||
              req.programId !== (metadataFormData.programId || placement.programId)
            ) {
              return false;
            }
            
            // Filter 2: Match emne (if provided in both)
            const placementEmne = metadataFormData.emne || placement.emne;
            if (placementEmne && req.emne && req.emne !== placementEmne) {
              return false;
            }
            
            // Filter 3: Only show approved or pending
            if (req.status !== 'approved' && req.status !== 'pending') {
              return false;
            }
            
            // Filter 4: Placement dates must be within quota request dates
            const placementStart = metadataFormData.startDate || placement.startDate;
            const placementEnd = metadataFormData.endDate || placement.endDate;
            
            if (placementStart && placementEnd && req.startDate && req.endDate) {
              const ps = new Date(placementStart);
              const pe = new Date(placementEnd);
              const qs = new Date(req.startDate);
              const qe = new Date(req.endDate);
              
              ps.setHours(0, 0, 0, 0);
              pe.setHours(0, 0, 0, 0);
              qs.setHours(0, 0, 0, 0);
              qe.setHours(0, 0, 0, 0);
              
              // Placement must be completely within quota date range
              if (!(ps >= qs && pe <= qe)) {
                return false;
              }
            }
            
            return true;
          })
          .flatMap((req) => {
            // Handle multi-entity requests - create separate items for each entity
            if (req.entityDistributions && req.entityDistributions.length > 0) {
              return req.entityDistributions.map((entity) => {
                const assignedCount = students.filter(
                  (s) =>
                    s.assignedPraksisPlace?.placeId === req.praksisPlaceId &&
                    s.assignedPraksisPlace?.entityId === entity.entityId &&
                    s.assignedPraksisPlace?.quotaRequestId === req.id
                ).length;
                return {
                  requestId: req.id,
                  placeId: req.praksisPlaceId,
                  placeName: req.praksisPlaceName,
                  departmentId: entity.entityId,
                  departmentName: entity.entityName,
                  currentAssigned: assignedCount,
                  quota: req.status === 'approved' 
                    ? (entity.approvedQuota ?? 0)
                    : 0,
                  status: req.status,
                };
              });
            } else {
              // Legacy single-entity request
              const assignedCount = students.filter(
                (s) =>
                  s.assignedPraksisPlace?.placeId === req.praksisPlaceId &&
                  s.assignedPraksisPlace?.departmentId === req.departmentId &&
                  s.assignedPraksisPlace?.quotaRequestId === req.id
              ).length;
              return [{
                requestId: req.id,
                placeId: req.praksisPlaceId,
                placeName: req.praksisPlaceName,
                departmentId: req.departmentId,
                departmentName: req.departmentName,
                currentAssigned: assignedCount,
                quota: req.status === 'approved' 
                  ? (req.approvedCapacity ?? req.requestedCapacity)
                  : 0,
                status: req.status,
              }];
            }
          })}
        placementTitle={placement.title}
        onAssignStudent={(
          studentId,
          placeId,
          departmentId,
          placeName,
          departmentName,
          quotaRequestId,
        ) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? {
                    ...s,
                    assignedPraksisPlace: {
                      placeId,
                      placeName,
                      departmentId,
                      departmentName,
                      entityId: departmentId, // for entity distributions, departmentId IS the entityId
                      quotaRequestId,
                      placementTaskId: placement.id,
                      startDate: placement.startDate,
                      endDate: placement.endDate,
                      placementTitle: placement.title,
                      assignedDate: new Date().toISOString(),
                    },
                  }
                : s,
            ),
          );
        }}
        onUnassignStudent={(studentId) => {
          setStudents((prev) =>
            prev.map((s) =>
              s.id === studentId
                ? { ...s, assignedPraksisPlace: undefined }
                : s,
            ),
          );
        }}
      />

      {/* Help Overlay */}
      <PlacementTaskHelpOverlay
        isOpen={isHelpOverlayOpen}
        onClose={() => setIsHelpOverlayOpen(false)}
      />
    </div>
  );
}