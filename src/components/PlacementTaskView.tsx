import { useState, useEffect, useRef, useMemo } from "react";
import { Info, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { QuotaSelection } from "./SlideOverManageQuota";
import { StudentPlacement } from "../types/studentPlacement";
import { Study } from "./SettingsView";
import { PraksisPlace, QuotaRequest } from "../types/praksisPlace";
import {
  Student,
  PlacementTask,
  placementTasks,
  mockStudents,
} from "../types/placementTask";
import { CrossPlacementData } from "./AvailableQuotasTable";
import { CoordinatorQuotaRequest } from "../types/coordinatorQuotaRequest";
import { PriorityPlacementPeriod, PriorityPlacementApplication } from "../types/priorityPlacement";
import { toast } from "sonner@2.0.3";
import AvailableQuotasTable from "./AvailableQuotasTable";
import { findNodeById } from "../types/organizationStructure";
import { PlacementTaskHeader } from "./PlacementTaskHeader";
import { PlacementMetadataForm, MetadataFormData } from "./PlacementMetadataForm";
import { AssignmentPublishBanner } from "./AssignmentPublishBanner";
import { StudentsPanel } from "./StudentsPanel";
import { PlacementModals, QuotaRequestOption } from "./PlacementModals";

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
  onCoordinatorQuotaRequestCreate?: (
    request: Omit<CoordinatorQuotaRequest, "id" | "requestedDate" | "status">,
  ) => void;
  onCoordinatorQuotaRequestUpdate?: (
    requestId: string,
    updates: Partial<CoordinatorQuotaRequest>,
  ) => void;
  currentUserName?: string;
  onPlacementStatusUpdate?: (
    placementId: string,
    status: "draft" | "upload" | "select" | "publish" | "completed",
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
      totalPraksisHours?: number;
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
  nodeSlots?: Record<string, Record<string, number>>;
  allPlacementsData?: CrossPlacementData[];
  priorityApplications?: PriorityPlacementApplication[];
  priorityPeriods?: PriorityPlacementPeriod[];
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
  currentUserName = "PK Coordinator",
  onPlacementStatusUpdate,
  onPlacementMetadataUpdate,
  onPlacementDelete,
  initialTaskState,
  onTaskStateUpdate,
  nodeSlots = {},
  allPlacementsData = [],
  priorityApplications = [],
  priorityPeriods = [],
  onboardingStep,
  onboardingData,
  setOnboardingStep,
  prefillData,
}: PlacementTaskViewProps) {
  // ── Metadata form state ──────────────────────────────────────────────────
  const [metadataFormData, setMetadataFormData] = useState<MetadataFormData>(
    () => {
      if (prefillData) {
        const startDateFormatted = prefillData.startDate;
        const [yearStr, monthStr] = prefillData.startDate.split("-");
        const year = yearStr;
        const month = parseInt(monthStr, 10) - 1;
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
    },
  );

  // ── Core data state ──────────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>(
    initialTaskState?.students || [],
  );
  const [tasks, setTasks] = useState<PlacementTask[]>(placementTasks);
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
  const [isAutoImportAlertDismissed, setIsAutoImportAlertDismissed] =
    useState(false);

  // ── UI layout state ──────────────────────────────────────────────────────
  const [isStudentsExpanded, setIsStudentsExpanded] = useState(false);

  // ── Assignment publish state ─────────────────────────────────────────────
  const [isAssignmentPublished, setIsAssignmentPublished] = useState(
    initialTaskState?.assignmentPublished ?? false,
  );
  const [assignmentPublishedDate, setAssignmentPublishedDate] = useState<
    string | null
  >(initialTaskState?.assignmentPublishedDate ?? null);
  const [wasEverPublished, setWasEverPublished] = useState(
    initialTaskState?.assignmentPublished ?? false,
  );
  const [showCongratulations, setShowCongratulations] = useState(false);

  // ── Modal / dialog open state ────────────────────────────────────────────
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isManageQuotaModalOpen, setIsManageQuotaModalOpen] = useState(false);
  const [isRequestQuotaModalOpen, setIsRequestQuotaModalOpen] = useState(false);
  const [isQuickAssignModalOpen, setIsQuickAssignModalOpen] = useState(false);
  const [isQuotaSelectionDialogOpen, setIsQuotaSelectionDialogOpen] =
    useState(false);
  const [showPublishWarning, setShowPublishWarning] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [isFirstPublishModalOpen, setIsFirstPublishModalOpen] = useState(false);
  const [isNetworkDiagramOpen, setIsNetworkDiagramOpen] = useState(false);
  const [isHelpOverlayOpen, setIsHelpOverlayOpen] = useState(false);

  // ── Modal selection state ────────────────────────────────────────────────
  const [selectedQuotaForAssignment, setSelectedQuotaForAssignment] = useState<{
    requestId: string;
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
    availableCapacity: number;
    entityId?: string;
  } | null>(null);
  const [editingQuotaRequest, setEditingQuotaRequest] =
    useState<CoordinatorQuotaRequest | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
  const importedCoordinatorRequestIds = useRef<Set<string>>(new Set());
  const hasInitialized = useRef(false);
  const onTaskStateUpdateRef = useRef(onTaskStateUpdate);
  useEffect(() => {
    onTaskStateUpdateRef.current = onTaskStateUpdate;
  }, [onTaskStateUpdate]);

  // ── Derived validation ───────────────────────────────────────────────────
  const dateValidationError =
    metadataFormData.startDate &&
    metadataFormData.endDate &&
    metadataFormData.startDate >= metadataFormData.endDate
      ? "Start date must be before end date"
      : "";

  // ── Computed stats ───────────────────────────────────────────────────────
  const placementsMadeCount = students.filter(
    (s) => s.assignedPraksisPlace,
  ).length;
  const placementsPendingCount = students.length - placementsMadeCount;
  const totalFixedQuotas = quotas.reduce((sum, q) => sum + q.fixedQuota, 0);
  const totalRequestQuotas = quotas.reduce(
    (sum, q) => sum + q.requestQuota,
    0,
  );

  const totalApprovedRequestQuotas = quotas.reduce((sum, quota) => {
    const matchingRequest = quotaRequests.find(
      (qr) =>
        qr.placementId === placement.id &&
        qr.departmentId === quota.departmentId,
    );
    if (matchingRequest?.requestQuotaStatus === "approved") {
      return sum + matchingRequest.requestQuota;
    }
    return sum;
  }, 0);

  const totalCoordinatorApprovedQuotas = coordinatorQuotaRequests
    ? coordinatorQuotaRequests.reduce((sum, req) => {
        const matchesStudy =
          req.studyId === placement.studyId ||
          req.studyId === metadataFormData.studyId;
        const matchesProgram =
          req.programId === placement.programId ||
          req.programId === metadataFormData.programId;
        const isApproved = req.status === "approved";

        let matchesDates = true;
        const placementStart =
          placement.startDate || metadataFormData.startDate;
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
          matchesDates = ps >= qs && pe <= qe;
        }

        if (isApproved && matchesStudy && matchesProgram && matchesDates) {
          if (req.entityDistributions && req.entityDistributions.length > 0) {
            let totalAvailable = 0;
            for (const entity of req.entityDistributions) {
              const entityAssignedCount = students.filter(
                (s) =>
                  s.assignedPraksisPlace?.placeId === req.praksisPlaceId &&
                  s.assignedPraksisPlace?.entityId === entity.entityId &&
                  s.assignedPraksisPlace?.quotaRequestId === req.id,
              ).length;
              const entityApprovedCapacity =
                entity.approvedQuota !== undefined
                  ? entity.approvedQuota
                  : entity.requestedQuota;
              totalAvailable += Math.max(
                0,
                entityApprovedCapacity - entityAssignedCount,
              );
            }
            return sum + totalAvailable;
          } else {
            const assignedCount = students.filter(
              (s) =>
                s.assignedPraksisPlace?.placeId === req.praksisPlaceId &&
                s.assignedPraksisPlace?.departmentId === req.departmentId &&
                s.assignedPraksisPlace?.quotaRequestId === req.id,
            ).length;
            const approvedCapacity =
              req.approvedCapacity ?? req.requestedCapacity;
            return sum + Math.max(0, approvedCapacity - assignedCount);
          }
        }
        return sum;
      }, 0)
    : 0;

  const quotaEntityKeys = new Set<string>(
    coordinatorQuotaRequests.flatMap((req) => {
      if (req.entityDistributions && req.entityDistributions.length > 0) {
        return req.entityDistributions.map(
          (e) =>
            `${req.praksisPlaceName.toLowerCase()}|${e.entityName.toLowerCase()}`,
        );
      }
      return [
        `${req.praksisPlaceName.toLowerCase()}|${req.departmentName.toLowerCase()}`,
      ];
    }),
  );

  const matchedPriorityApplications = useMemo((): PriorityPlacementApplication[] => {
    const sem = placement.semester;
    const normalizedSemester: "HT" | "VT" =
      sem === "Fall" || sem === "Autumn" ? "HT" : "VT";
    const matchedPeriod = priorityPeriods.find(
      (p) =>
        p.year === placement.year &&
        p.semester === normalizedSemester &&
        p.studyIds.includes(placement.studyId) &&
        p.programIds.includes(placement.programId)
    );
    if (!matchedPeriod) return [];
    return priorityApplications.filter(
      (a) => a.periodId === matchedPeriod.id && a.status === "approved"
    );
  }, [priorityPeriods, priorityApplications, placement]);

  const totalQuotas = totalCoordinatorApprovedQuotas;
  const currentTask = tasks.find((t) => !t.completed);
  const isFirstPublishCompleted =
    tasks.find((t) => t.step === "2/6")?.completed || false;
  const allStudentsAssigned =
    students.length > 0 && students.every((s) => s.assignedPraksisPlace);

  const getAvailableQuotas = () => {
    return quotas.map((quota) => {
      const assignedCount = students.filter(
        (s) =>
          s.assignedPraksisPlace?.placeId === quota.placeId &&
          s.assignedPraksisPlace?.departmentId === quota.departmentId,
      ).length;

      const quotaRequest = quotaRequests.find(
        (qr) =>
          qr.placementId === placement.id &&
          qr.praksisPlaceId === quota.placeId &&
          qr.departmentId === quota.departmentId,
      );

      let pendingRequestQuota = 0;
      let approvedRequestQuota = 0;
      let rejectedRequestQuota = 0;

      if (quotaRequest) {
        if (quotaRequest.requestQuotaStatus === "pending") {
          pendingRequestQuota = quotaRequest.requestQuota;
        } else if (quotaRequest.requestQuotaStatus === "approved") {
          approvedRequestQuota = quotaRequest.requestQuota;
        } else if (quotaRequest.requestQuotaStatus === "rejected") {
          rejectedRequestQuota = quotaRequest.requestQuota;
        }
      }

      const availableCount =
        quota.fixedQuota + approvedRequestQuota - assignedCount;

      return {
        ...quota,
        assignedCount,
        availableCount: Math.max(0, availableCount),
        pendingRequestQuota,
        approvedRequestQuota,
        rejectedRequestQuota,
      };
    });
  };

  const availableQuotas = getAvailableQuotas();
  const totalAvailableQuota = availableQuotas.reduce(
    (sum, q) => sum + q.availableCount,
    0,
  );

  const getAvailableQuotaRequests = (): QuotaRequestOption[] => {
    const result: QuotaRequestOption[] = [];

    for (const request of coordinatorQuotaRequests) {
      if (request.status !== "approved") continue;

      const matchesStudy =
        request.studyId ===
        (metadataFormData.studyId || placement.studyId);
      const matchesProgram =
        request.programId ===
        (metadataFormData.programId || placement.programId);
      if (!matchesStudy || !matchesProgram) continue;

      if (
        request.entityDistributions &&
        request.entityDistributions.length > 0
      ) {
        for (const entity of request.entityDistributions) {
          const capacity = entity.approvedQuota ?? entity.requestedQuota;
          const assignedCount = students.filter(
            (s) =>
              s.assignedPraksisPlace?.quotaRequestId === request.id &&
              s.assignedPraksisPlace?.entityId === entity.entityId,
          ).length;
          const crossConsumed = allPlacementsData.flatMap((d) => d.students).filter(
            (s) =>
              s.assignedPraksisPlace?.quotaRequestId === request.id &&
              s.assignedPraksisPlace?.entityId === entity.entityId,
          ).length;
          const availableCount = capacity - crossConsumed - assignedCount;
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
        const approvedCapacity =
          request.approvedCapacity ?? request.requestedCapacity;
        const assignedCount = students.filter(
          (s) => s.assignedPraksisPlace?.quotaRequestId === request.id,
        ).length;
        const crossConsumed = allPlacementsData.flatMap((d) => d.students).filter(
          (s) => s.assignedPraksisPlace?.quotaRequestId === request.id,
        ).length;
        const availableCount = approvedCapacity - crossConsumed - assignedCount;
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

  // ── Auto-import approved coordinator quota requests ───────────────────────
  const autoImportApprovedQuotaRequests = (): number => {
    const approvedRequests = coordinatorQuotaRequests.filter(
      (request) =>
        request.placementId === placement.id &&
        request.status === "approved" &&
        !importedCoordinatorRequestIds.current.has(request.id),
    );

    if (approvedRequests.length === 0) return 0;

    const updatedQuotasMap = new Map<string, QuotaSelection>();
    quotas.forEach((quota) => {
      updatedQuotasMap.set(`${quota.placeId}-${quota.departmentId}`, {
        ...quota,
      });
    });

    let newImportCount = 0;
    approvedRequests.forEach((request) => {
      const key = `${request.praksisPlaceId}-${request.departmentId}`;
      if (!updatedQuotasMap.has(key)) {
        updatedQuotasMap.set(key, {
          placeId: request.praksisPlaceId,
          placeName: request.praksisPlaceName,
          departmentId: request.departmentId,
          departmentName: request.departmentName,
          fixedQuota: request.requestedCapacity,
          requestQuota: 0,
        });
        newImportCount++;
      }
      importedCoordinatorRequestIds.current.add(request.id);
    });

    if (newImportCount > 0) {
      const updatedQuotas = Array.from(updatedQuotasMap.values());
      setQuotas(updatedQuotas);
      setQuotasSelected(true);

      if (onTaskStateUpdateRef.current) {
        const completedTaskIds = tasks.filter((t) => t.completed).map((t) => t.id);
        const allAssigned =
          students.length > 0 && students.every((s) => s.assignedPraksisPlace);
        onTaskStateUpdateRef.current({
          placementId: placement.id,
          studentsImported,
          students,
          quotasSelected: true,
          quotas: updatedQuotas,
          firstPublished: tasks.find((t) => t.step === "2/6")?.completed || false,
          studentsAssigned: allAssigned,
          documentsAttached: tasks.find((t) => t.step === "5/6")?.completed || false,
          finalPublished: tasks.find((t) => t.step === "6/6")?.completed || false,
          completedTasks: completedTaskIds,
        });
      }
    }

    return newImportCount;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleImportStudents = () => {
    if (!studentsImported) {
      setStudents(mockStudents);
      setStudentsImported(true);
    }
  };

  const handleTaskAction = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.actionType === "mark") {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
      );
    } else if (task.actionType === "publish") {
      if (task.step === "2/6") {
        setIsTasksModalOpen(false);
        setIsFirstPublishModalOpen(true);
        return;
      }
      if (task.step === "6/6") {
        const allMandatoryCompleted = tasks
          .filter((t) => t.status === "mandatory" && t.id !== taskId)
          .every((t) => t.completed);
        if (!allMandatoryCompleted) {
          alert(
            "Cannot publish: Please complete all mandatory tasks before publishing.",
          );
          return;
        }
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
      );
    }
  };

  const handleMetadataFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dateValidationError) return;

    if (onPlacementMetadataUpdate) {
      onPlacementMetadataUpdate(placement.id, {
        title: metadataFormData.title,
        year: metadataFormData.year,
        semester: metadataFormData.semester,
        subject: metadataFormData.subject,
        startDate: metadataFormData.startDate,
        endDate: metadataFormData.endDate,
        students: metadataFormData.students,
        studyId: metadataFormData.studyId,
        programId: metadataFormData.programId,
        totalPraksisHours: metadataFormData.totalPraksisHours,
      });
    }

    if (onPlacementStatusUpdate && placement.status === "draft") {
      onPlacementStatusUpdate(placement.id, "upload");
    }

    if (onboardingStep === 3 && setOnboardingStep) {
      setOnboardingStep(0);
    }
  };

  const handleCancelDraft = () => {
    if (placement.status === "draft" && onPlacementDelete) {
      onPlacementDelete(placement.id);
    }
    onBack();
  };

  const handleFirstPublish = (deadline: string, message: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.step === "2/6" ? { ...t, completed: true } : t)),
    );

    if (onPlacementStatusUpdate) {
      onPlacementStatusUpdate(placement.id, "publish");
    }

    setTimeout(() => {
      const praksisPlaceNames = [...new Set(praksisPlaces.map((p) => p.name))];
      const sampleMessages = [
        "I would prefer this location as it's close to my home.",
        "I'm interested in this department because of my previous experience in similar settings.",
        "This praksis place aligns well with my career goals.",
        "I have specific interest in the programs offered here.",
        "Would be great if I could get placed here due to transportation convenience.",
      ];

      setStudents((prev) =>
        prev.map((student) => {
          const submits = Math.random() > 0.2;
          if (submits) {
            return {
              ...student,
              customRequestSubmitted: true,
              customRequest: {
                preferredPlaceName:
                  praksisPlaceNames[
                    Math.floor(Math.random() * praksisPlaceNames.length)
                  ],
                message:
                  sampleMessages[
                    Math.floor(Math.random() * sampleMessages.length)
                  ],
                submittedAt: new Date().toISOString(),
              },
            };
          }
          return student;
        }),
      );
    }, 2000);
  };

  const handleAssignStudent = (
    studentId: string,
    placeId: string,
    departmentId: string,
    requestApproval?: boolean,
    quotaRequestId?: string,
    entityId?: string,
  ) => {
    const place = praksisPlaces.find((p) => p.id === placeId);

    if (!place) {
      toast.error("Could not find the selected praksis place");
      return;
    }

    let department = place.departments.find((d) => d.id === departmentId);
    let departmentName = department?.name;

    if (!department && place.organizationStructure) {
      const node = findNodeById(place.organizationStructure, departmentId);
      if (node) departmentName = node.name;
    }

    if (!departmentName) {
      toast.error("Could not find the selected department");
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
                departmentName,
                entityId: entityId || departmentId,
                placementTaskId: placement.id,
                quotaRequestId,
                startDate: placement.startDate,
                endDate: placement.endDate,
                placementTitle: placement.title,
                assignedDate: new Date().toISOString(),
                approvalRequested: requestApproval,
                approvalStatus: requestApproval ? "pending" : undefined,
              },
            }
          : s,
      ),
    );
  };

  // StudentsPanel file-operation callbacks
  const handleDetachStudent = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, assignedPraksisPlace: undefined } : s,
      ),
    );
  };

  const handleAttachFiles = (
    studentId: string,
    files: Array<{ name: string; size: number; uploadedAt: string }>,
  ) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              attachedFiles: [
                ...(s.attachedFiles || []),
                ...files.map((f, i) => ({
                  ...f,
                  id: `${studentId}-file-${Date.now()}-${i}`,
                })),
              ],
            }
          : s,
      ),
    );
  };

  const handleBulkAttachFiles = (
    studentIds: string[],
    files: Array<{ name: string; size: number; uploadedAt: string }>,
  ) => {
    setStudents((prev) =>
      prev.map((s) =>
        studentIds.includes(s.id)
          ? {
              ...s,
              attachedFiles: [
                ...(s.attachedFiles || []),
                ...files.map((f, i) => ({
                  ...f,
                  id: `${s.id}-file-${Date.now()}-${i}`,
                })),
              ],
            }
          : s,
      ),
    );
  };

  const handleRemoveFile = (studentId: string, fileId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              attachedFiles: s.attachedFiles?.filter((f) => f.id !== fileId),
            }
          : s,
      ),
    );
  };

  const handlePublishConfirm = () => {
    const now = new Date().toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    setIsAssignmentPublished(true);
    setWasEverPublished(true);
    setAssignmentPublishedDate(now);
    setIsPublishConfirmOpen(false);
    toast.success("Assignments published successfully");
  };

  const handleQuickAssignConfirm = (studentIds: string[]) => {
    if (!selectedQuotaForAssignment) return;
    studentIds.forEach((studentId) => {
      handleAssignStudent(
        studentId,
        selectedQuotaForAssignment.praksisPlaceId,
        selectedQuotaForAssignment.departmentId,
        false,
        selectedQuotaForAssignment.requestId,
        selectedQuotaForAssignment.entityId,
      );
    });
    const count = studentIds.length;
    toast.success(
      `Successfully assigned ${count} student${count !== 1 ? "s" : ""} to ${selectedQuotaForAssignment.praksisPlaceName} - ${selectedQuotaForAssignment.departmentName}`,
    );
    setIsQuickAssignModalOpen(false);
    setSelectedQuotaForAssignment(null);
  };

  const handleAssignStudentToQuota = (
    studentId: string,
    placeId: string,
    deptId: string,
    requestId: string,
    entityId?: string,
  ) => {
    handleAssignStudent(studentId, placeId, deptId, false, requestId, entityId);
    setIsQuotaSelectionDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleNetworkAssignStudent = (
    studentId: string,
    placeId: string,
    departmentId: string,
    placeName: string,
    departmentName: string,
    quotaRequestId?: string,
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
                entityId: departmentId,
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
  };

  const handleNetworkUnassignStudent = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, assignedPraksisPlace: undefined } : s,
      ),
    );
  };

  const handleSaveQuotas = (newQuotas: QuotaSelection[]) => {
    setQuotas(newQuotas);

    if (onQuotaRequestCreate) {
      const requests: any[] = [];
      const timestamp = Date.now();
      let counter = 0;

      newQuotas.forEach((quota) => {
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
          placementStatus: placement.status,
        };

        if (existingRequest) {
          const historyItems: any[] = [...(existingRequest.history || [])];
          let needsReapproval = false;

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

          if (existingRequest.requestQuota !== quota.requestQuota) {
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
  };

  const handleRequestQuotaSubmit = (
    requestData: Omit<CoordinatorQuotaRequest, "id" | "requestedDate" | "status">,
  ) => {
    if (onCoordinatorQuotaRequestCreate) {
      onCoordinatorQuotaRequestCreate(requestData);
      setIsRequestQuotaModalOpen(false);
    }
  };

  const handleQuickAssign = (quotaInfo: {
    requestId: string;
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
    availableCapacity: number;
    entityId?: string;
  }) => {
    const unassignedStudents = students.filter((s) => !s.assignedPraksisPlace);
    if (unassignedStudents.length === 0) {
      toast.error("No unassigned students available");
      return;
    }
    if (quotaInfo.availableCapacity === 0) {
      toast.error("No available capacity in this quota");
      return;
    }
    setSelectedQuotaForAssignment(quotaInfo);
    setIsQuickAssignModalOpen(true);
  };

  const handleRequestMoreQuotas = () => setIsRequestQuotaModalOpen(true);

  const handleApproveRequest = async (
    requestId: string,
    approvedCapacity: number,
    entityId?: string,
  ) => {
    if (!onCoordinatorQuotaRequestUpdate) return;

    if (entityId) {
      const request = coordinatorQuotaRequests.find((r) => r.id === requestId);
      if (request?.entityDistributions) {
        const updatedDistributions = request.entityDistributions.map((e) =>
          e.entityId === entityId ? { ...e, approvedQuota: approvedCapacity } : e,
        );
        const allApproved = updatedDistributions.every(
          (e) => e.approvedQuota !== undefined,
        );
        onCoordinatorQuotaRequestUpdate(requestId, {
          entityDistributions: updatedDistributions,
          ...(allApproved ? { status: "approved" as const } : {}),
        });
        toast.success(
          `Approved capacity of ${approvedCapacity} for ${request.entityDistributions.find((e) => e.entityId === entityId)?.entityName ?? entityId}`,
        );
      }
    } else {
      onCoordinatorQuotaRequestUpdate(requestId, {
        status: "approved",
        approvedCapacity,
      });
      toast.success(
        `Quota request approved with capacity of ${approvedCapacity}`,
      );
    }
  };

  const handleEditRequest = (requestId: string) => {
    const request = coordinatorQuotaRequests.find((r) => r.id === requestId);
    if (request) {
      setEditingQuotaRequest(request);
      setIsRequestQuotaModalOpen(true);
    }
  };

  const handleDeleteRequest = (requestId: string, entityId?: string) => {
    if (!onCoordinatorQuotaRequestUpdate) return;

    if (entityId) {
      const request = coordinatorQuotaRequests.find((r) => r.id === requestId);
      if (request?.entityDistributions) {
        const updatedDistributions = request.entityDistributions.filter(
          (e) => e.entityId !== entityId,
        );
        if (updatedDistributions.length === 0) {
          onCoordinatorQuotaRequestUpdate(requestId, { status: "rejected" });
        } else {
          onCoordinatorQuotaRequestUpdate(requestId, {
            entityDistributions: updatedDistributions,
          });
        }
        toast.success("Entity removed from quota request");
      }
    } else {
      onCoordinatorQuotaRequestUpdate(requestId, { status: "rejected" });
      toast.success("Quota request deleted successfully");
    }
  };

  const handleUpdateQuotaRequest = (
    requestId: string,
    updates: Partial<CoordinatorQuotaRequest>,
  ) => {
    if (onCoordinatorQuotaRequestUpdate) {
      onCoordinatorQuotaRequestUpdate(requestId, updates);
      setIsRequestQuotaModalOpen(false);
      setEditingQuotaRequest(null);
      toast.success("Quota request updated successfully");
    }
  };

  const handleAIAction = (action: string, data: any) => {
    if (action === "add_quota") {
      const departmentName = data.department;
      const quotaCount = data.count;
      const place = praksisPlaces.find((p) =>
        p.departments.some((d) => d.name === departmentName),
      );
      if (place) {
        const department = place.departments.find(
          (d) => d.name === departmentName,
        );
        if (department) {
          const existingIdx = quotas.findIndex(
            (q) =>
              q.placeId === place.id && q.departmentId === department.id,
          );
          if (existingIdx >= 0) {
            setQuotas((prev) =>
              prev.map((q, idx) =>
                idx === existingIdx
                  ? { ...q, fixedQuota: q.fixedQuota + quotaCount }
                  : q,
              ),
            );
          } else {
            setQuotas((prev) => [
              ...prev,
              {
                placeId: place.id,
                placeName: place.name,
                departmentId: department.id,
                departmentName: department.name,
                fixedQuota: quotaCount,
                requestQuota: 0,
              },
            ]);
          }
        }
      }
    } else if (action === "assign_student") {
      const departmentName = data.department;
      const place = praksisPlaces.find((p) =>
        p.departments.some((d) => d.name === departmentName),
      );
      if (place) {
        const department = place.departments.find(
          (d) => d.name === departmentName,
        );
        if (department) {
          handleAssignStudent(
            data.student.id,
            place.id,
            department.id,
            false,
          );
        }
      }
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────

  // Auto-complete Step 1/6 when students imported AND sufficient quotas exist
  useEffect(() => {
    const studentsReady = studentsImported && students.length > 0;
    const quotasReady = students.length > 0 && totalQuotas >= students.length;
    if (studentsReady && quotasReady) {
      setTasks((prev) =>
        prev.map((t, idx) => (idx === 0 ? { ...t, completed: true } : t)),
      );
    }
  }, [studentsImported, students.length, totalQuotas]);

  // Auto-complete or auto-uncomplete Step 3/6 based on assignment status
  useEffect(() => {
    if (!studentsImported || students.length === 0) return;
    const allAssigned = students.every((s) => s.assignedPraksisPlace);
    setTasks((prev) =>
      prev.map((t, idx) => (idx === 2 ? { ...t, completed: allAssigned } : t)),
    );
  }, [students, studentsImported]);

  // Initialise task completion from initialTaskState (only once)
  useEffect(() => {
    if (!hasInitialized.current && initialTaskState?.completedTasks) {
      setTasks((prev) =>
        prev.map((t) => ({
          ...t,
          completed: initialTaskState.completedTasks.includes(t.id),
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

  // Sync state back to parent
  useEffect(() => {
    if (onTaskStateUpdateRef.current) {
      const completedTaskIds = tasks.filter((t) => t.completed).map((t) => t.id);
      const allAssigned =
        students.length > 0 && students.every((s) => s.assignedPraksisPlace);

      onTaskStateUpdateRef.current({
        placementId: placement.id,
        studentsImported,
        students,
        quotasSelected: quotas.length > 0,
        quotas,
        firstPublished: tasks.find((t) => t.step === "2/6")?.completed || false,
        studentsAssigned: allAssigned,
        documentsAttached: tasks.find((t) => t.step === "4/6")?.completed || false,
        finalPublished: tasks.find((t) => t.step === "6/6")?.completed || false,
        completedTasks: completedTaskIds,
        assignmentPublished: isAssignmentPublished,
        assignmentPublishedDate: assignmentPublishedDate ?? undefined,
      });
    }
  }, [
    students,
    quotas,
    studentsImported,
    tasks,
    placement.id,
    isAssignmentPublished,
    assignmentPublishedDate,
  ]);

  // ── Pre-computed modal data ───────────────────────────────────────────────

  const networkDiagramStudents = students.map((s) => ({
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
  }));

  const placementStudyId = metadataFormData.studyId || placement.studyId;
  const placementProgramId = metadataFormData.programId || placement.programId;
  const placementStartDate = metadataFormData.startDate || placement.startDate;
  const placementEndDate = metadataFormData.endDate || placement.endDate;
  const placementEmne = metadataFormData.emne || (placement as any).emne;

  const networkDiagramQuotas = (coordinatorQuotaRequests || [])
    .filter((req) => {
      if (
        req.studyId !== placementStudyId ||
        req.programId !== placementProgramId
      )
        return false;
      if (placementEmne && req.emne && req.emne !== placementEmne) return false;
      if (req.status !== "approved" && req.status !== "pending") return false;
      if (
        placementStartDate &&
        placementEndDate &&
        req.startDate &&
        req.endDate
      ) {
        const ps = new Date(placementStartDate);
        const pe = new Date(placementEndDate);
        const qs = new Date(req.startDate);
        const qe = new Date(req.endDate);
        ps.setHours(0, 0, 0, 0);
        pe.setHours(0, 0, 0, 0);
        qs.setHours(0, 0, 0, 0);
        qe.setHours(0, 0, 0, 0);
        if (!(ps >= qs && pe <= qe)) return false;
      }
      return true;
    })
    .flatMap((req) => {
      if (req.entityDistributions && req.entityDistributions.length > 0) {
        return req.entityDistributions.map((entity) => {
          const assignedCount = students.filter(
            (s) =>
              s.assignedPraksisPlace?.placeId === req.praksisPlaceId &&
              s.assignedPraksisPlace?.entityId === entity.entityId &&
              s.assignedPraksisPlace?.quotaRequestId === req.id,
          ).length;
          return {
            requestId: req.id,
            placeId: req.praksisPlaceId,
            placeName: req.praksisPlaceName,
            departmentId: entity.entityId,
            departmentName: entity.entityName,
            currentAssigned: assignedCount,
            quota:
              req.status === "approved" ? (entity.approvedQuota ?? 0) : 0,
            status: req.status,
          };
        });
      } else {
        const assignedCount = students.filter(
          (s) =>
            s.assignedPraksisPlace?.placeId === req.praksisPlaceId &&
            s.assignedPraksisPlace?.departmentId === req.departmentId &&
            s.assignedPraksisPlace?.quotaRequestId === req.id,
        ).length;
        return [
          {
            requestId: req.id,
            placeId: req.praksisPlaceId,
            placeName: req.praksisPlaceName,
            departmentId: req.departmentId,
            departmentName: req.departmentName,
            currentAssigned: assignedCount,
            quota:
              req.status === "approved"
                ? (req.approvedCapacity ?? req.requestedCapacity)
                : 0,
            status: req.status,
          },
        ];
      }
    });

  const requestQuotaPlacementData = {
    id: placement.id,
    studyId: placementStudyId,
    studyName:
      studies.find((s) => s.id === placementStudyId)?.name || "",
    programId: placementProgramId,
    programName:
      studies
        .find((s) => s.id === placementStudyId)
        ?.programs.find((p) => p.id === placementProgramId)?.name || "",
    universityId: "U1",
    universityName: "University of Oslo",
    startDate: placementStartDate,
    endDate: placementEndDate,
  };

  const existingQuotasForRequest = quotas.map((q) => ({
    praksisPlaceId: (q as any).praksisPlaceId || q.placeId,
    praksisPlaceName: (q as any).praksisPlaceName || q.placeName,
    departmentId: q.departmentId,
    departmentName: q.departmentName,
  }));

  const aiCurrentTaskIndex =
    tasks.findIndex((t) => !t.completed) >= 0
      ? tasks.findIndex((t) => !t.completed)
      : tasks.length - 1;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full w-full">
      <div className="flex flex-col flex-1 bg-white min-h-full overflow-auto">
        <PlacementTaskHeader
          placement={placement}
          currentTask={currentTask}
          isAssignmentPublished={isAssignmentPublished}
          onBack={onBack}
          onOpenTasks={() => setIsTasksModalOpen(true)}
          onEdit={() => setIsAssignmentPublished(false)}
          onHelp={() => setIsHelpOverlayOpen(true)}
        />

        {/* Draft placement info banner */}
        {placement.status === "draft" && (
          <div className="px-8 py-4">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">
                Welcome! Let's Get Started
              </AlertTitle>
              <AlertDescription className="text-blue-800">
                Fill in the placement details below to create your student
                placement program.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Congratulations banner */}
        {showCongratulations && !currentTask && (
          <div className="px-8 py-4">
            <div className="border rounded-xl p-6 flex items-start gap-4 bg-green-50 border-green-200">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-green-900 text-lg mb-1">
                  🎉 Congratulations! You successfully completed the placement
                </div>
                <div className="text-sm text-green-700">
                  All tasks have been completed and the placement has been
                  published. Students will be notified of their assignments.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white">
          {placement.status === "draft" ? (
            <PlacementMetadataForm
              formData={metadataFormData}
              studies={studies}
              dateValidationError={dateValidationError}
              startDateInputRef={startDateInputRef}
              endDateInputRef={endDateInputRef}
              onChange={setMetadataFormData}
              onSubmit={handleMetadataFormSubmit}
              onCancel={handleCancelDraft}
            />
          ) : (
            <div className="space-y-4 pt-6">
              {/* Validation alerts */}
              {!isStudentsExpanded &&
                students.length > 0 &&
                totalQuotas < students.length &&
                !allStudentsAssigned && (
                  <Alert className="bg-amber-50 border-amber-200">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-900">
                      Insufficient Quotas
                    </AlertTitle>
                    <AlertDescription className="text-amber-800">
                      You have {students.length} students but only {totalQuotas}{" "}
                      quota{totalQuotas !== 1 ? "s" : ""}. Add{" "}
                      {students.length - totalQuotas} more quota
                      {students.length - totalQuotas !== 1 ? "s" : ""} to
                      complete this step.
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
                    You have allocated {totalQuotas} quota
                    {totalQuotas !== 1 ? "s" : ""}. Import students to continue
                    with the placement process.
                  </AlertDescription>
                </Alert>
              )}

              {/* Assignment publish banner */}
              {studentsImported && allStudentsAssigned && students.length > 0 && (
                <AssignmentPublishBanner
                  isPublished={isAssignmentPublished}
                  publishedDate={assignmentPublishedDate}
                  wasEverPublished={wasEverPublished}
                  onPublish={() => setIsPublishConfirmOpen(true)}
                  onCancelEdit={() => setIsAssignmentPublished(true)}
                />
              )}

              {/* Split panel: quotas sidebar + students */}
              <div className="flex gap-4 items-start">
                {/* Left panel: Available Quotas (sticky sidebar) */}
                {!isStudentsExpanded && (
                  <div className="w-[400px] flex-shrink-0 sticky top-6 max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    <AvailableQuotasTable
                      coordinatorQuotaRequests={coordinatorQuotaRequests}
                      students={students}
                      crossPlacementData={allPlacementsData}
                      praksisPlaces={praksisPlaces}
                      placementId={placement.id}
                      studyId={placementStudyId}
                      programId={placementProgramId}
                      emne={placementEmne}
                      startDate={placementStartDate}
                      endDate={placementEndDate}
                      isPublished={isFirstPublishCompleted}
                      readOnly={isAssignmentPublished}
                      onQuickAssign={handleQuickAssign}
                      onRequestMoreQuotas={handleRequestMoreQuotas}
                      onApproveRequest={handleApproveRequest}
                      onEditRequest={handleEditRequest}
                      onDeleteRequest={handleDeleteRequest}
                    />
                  </div>
                )}

                {/* Right panel: Students */}
                <div className="flex-1 min-w-0">
                  <StudentsPanel
                    students={students}
                    isAssignmentPublished={isAssignmentPublished}
                    isFirstPublishCompleted={isFirstPublishCompleted}
                    isStudentsExpanded={isStudentsExpanded}
                    quotaEntityKeys={quotaEntityKeys}
                    priorityApplications={matchedPriorityApplications}
                    onStudentsExpandChange={setIsStudentsExpanded}
                    onImportStudents={handleImportStudents}
                    onDetachStudent={handleDetachStudent}
                    onAttachFiles={handleAttachFiles}
                    onBulkAttachFiles={handleBulkAttachFiles}
                    onRemoveFile={handleRemoveFile}
                    onOpenQuotaDialog={(student) => {
                      setSelectedStudent(student);
                      setIsQuotaSelectionDialogOpen(true);
                    }}
                    onShowPublishWarning={() => setShowPublishWarning(true)}
                    onOpenNetworkDiagram={() => setIsNetworkDiagramOpen(true)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* All modals and overlays */}
        <PlacementModals
          isTasksModalOpen={isTasksModalOpen}
          onCloseTasksModal={() => setIsTasksModalOpen(false)}
          tasks={tasks}
          onTaskAction={handleTaskAction}
          isPublishConfirmOpen={isPublishConfirmOpen}
          onClosePublishConfirm={() => setIsPublishConfirmOpen(false)}
          onPublishConfirm={handlePublishConfirm}
          isQuickAssignModalOpen={isQuickAssignModalOpen}
          selectedQuotaForAssignment={selectedQuotaForAssignment}
          unassignedStudents={students.filter((s) => !s.assignedPraksisPlace)}
          priorityApplications={matchedPriorityApplications}
          onCloseQuickAssign={() => {
            setIsQuickAssignModalOpen(false);
            setSelectedQuotaForAssignment(null);
          }}
          onQuickAssignConfirm={handleQuickAssignConfirm}
          isQuotaSelectionDialogOpen={isQuotaSelectionDialogOpen}
          selectedStudent={selectedStudent}
          availableQuotaRequests={getAvailableQuotaRequests()}
          onCloseQuotaSelection={() => {
            setIsQuotaSelectionDialogOpen(false);
            setSelectedStudent(null);
          }}
          onAssignStudentToQuota={handleAssignStudentToQuota}
          isManageQuotaModalOpen={isManageQuotaModalOpen}
          praksisPlaces={praksisPlaces}
          existingQuotas={quotas}
          onCloseManageQuota={() => setIsManageQuotaModalOpen(false)}
          onSaveQuotas={handleSaveQuotas}
          isRequestQuotaModalOpen={isRequestQuotaModalOpen}
          editingQuotaRequest={editingQuotaRequest}
          requestQuotaPlacementData={requestQuotaPlacementData}
          existingQuotasForRequest={existingQuotasForRequest}
          currentUserName={currentUserName}
          coordinatorQuotaRequestsForPlacement={coordinatorQuotaRequests.filter(
            (req) => req.placementId === placement.id,
          )}
          nodeSlots={nodeSlots}
          onCloseRequestQuota={() => {
            setIsRequestQuotaModalOpen(false);
            setEditingQuotaRequest(null);
          }}
          onRequestQuotaSubmit={handleRequestQuotaSubmit}
          onUpdateQuotaRequest={handleUpdateQuotaRequest}
          isAISidebarOpen={isAISidebarOpen}
          onCloseAISidebar={() => onAISidebarChange?.(false)}
          onAIAction={handleAIAction}
          availableDepartments={availableQuotas}
          aiStudents={students}
          aiTasks={tasks.map((t) => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
          }))}
          aiCurrentTaskIndex={aiCurrentTaskIndex}
          isFirstPublishModalOpen={isFirstPublishModalOpen}
          onCloseFirstPublish={() => setIsFirstPublishModalOpen(false)}
          onFirstPublish={handleFirstPublish}
          showPublishWarning={showPublishWarning}
          onClosePublishWarning={() => setShowPublishWarning(false)}
          isNetworkDiagramOpen={isNetworkDiagramOpen}
          onCloseNetworkDiagram={() => setIsNetworkDiagramOpen(false)}
          networkDiagramStudents={networkDiagramStudents}
          networkDiagramQuotas={networkDiagramQuotas}
          placementTitle={placement.title}
          onNetworkAssignStudent={handleNetworkAssignStudent}
          onNetworkUnassignStudent={handleNetworkUnassignStudent}
          isHelpOverlayOpen={isHelpOverlayOpen}
          onCloseHelp={() => setIsHelpOverlayOpen(false)}
        />
      </div>
    </div>
  );
}
