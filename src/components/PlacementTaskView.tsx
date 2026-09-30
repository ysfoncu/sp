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
import { PraksisPlaceLimit, savePraksisLimits, usePraksisLimits } from "../types/praksisLimit";
import { AddLimitModal } from "./AddLimitModal";
import { limitTreeForPlacement, limitViolations, totalPlacesForPlacement } from "../types/limitUsage";
import { PriorityPlacementPeriod, PriorityPlacementApplication } from "../types/priorityPlacement";
import { toast } from "sonner@2.0.3";
import AvailableLimitsPanel from "./AvailableLimitsPanel";
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
  studies: Study[];
  onBack: () => void;
  isAISidebarOpen?: boolean;
  onAISidebarChange?: (isOpen: boolean) => void;
  onQuotaRequestCreate?: (requests: any[]) => void;
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
  // Opens Praksis places, where limits are added
  onRequestQuota?: () => void;
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
  studies,
  onBack,
  isAISidebarOpen = false,
  onAISidebarChange,
  onQuotaRequestCreate,
  currentUserName = "PK Coordinator",
  onPlacementStatusUpdate,
  onPlacementMetadataUpdate,
  onPlacementDelete,
  onRequestQuota,
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
  const [isQuickAssignModalOpen, setIsQuickAssignModalOpen] = useState(false);
  const [isQuotaSelectionDialogOpen, setIsQuotaSelectionDialogOpen] =
    useState(false);
  const [showPublishWarning, setShowPublishWarning] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [isFirstPublishModalOpen, setIsFirstPublishModalOpen] = useState(false);
  const [isNetworkDiagramOpen, setIsNetworkDiagramOpen] = useState(false);
  const [isHelpOverlayOpen, setIsHelpOverlayOpen] = useState(false);
  // Edit a Praksis place limit without leaving the placement (limits are added on Praksis places)
  const [editingLimit, setEditingLimit] = useState<PraksisPlaceLimit | null>(null);

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
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const startDateInputRef = useRef<HTMLInputElement>(null);
  const endDateInputRef = useRef<HTMLInputElement>(null);
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

  // The placement's program/emne and period — only Praksis place limits that include this emne
  // can be used, counted per limit period across placements
  const quotaContext = {
    studyId: metadataFormData.studyId || placement.studyId,
    programId: metadataFormData.programId || placement.programId,
    emne: metadataFormData.subject || placement.subject,
    startDate: metadataFormData.startDate || placement.startDate,
    year: metadataFormData.year || placement.year,
    semester: metadataFormData.semester || placement.semester,
  };

  const allLimits = usePraksisLimits();
  // Limits (nested) this emne can use, per praksis place, with usage worked out from where
  // students are placed — here and in other placements of the emne in the same period
  const limitTrees = limitTreeForPlacement(allLimits, praksisPlaces, quotaContext, students, allPlacementsData);

  // Limits breaking the nesting rules, shown with a danger icon in the panel
  const limitRuleViolations = new Map(
    limitTrees.flatMap((t) => {
      const root = praksisPlaces.find((p) => p.id === t.praksisPlaceId)?.organizationStructure;
      return root ? [...limitViolations(allLimits.filter((l) => l.praksisPlaceId === t.praksisPlaceId), root)] : [];
    }),
  );

  const placementEmneRef = (() => {
    const program = studies
      .find((st) => st.id === quotaContext.studyId)
      ?.programs.find((pr) => pr.id === quotaContext.programId);
    const emne = program?.emner?.find((e) => e.name === quotaContext.emne);
    return program && emne ? { programId: program.id, emneId: emne.id } : undefined;
  })();

  // Places this placement can use: every topmost limit's share minus what other placements used
  const totalLimitPlaces = totalPlacesForPlacement(limitTrees);

  // "place|unit" for every unit the limits cover — used to flag earlier placements at the same unit
  const quotaEntityKeys = new Set<string>(
    limitTrees.flatMap((t) => t.units.map((u) => `${t.praksisPlaceName.toLowerCase()}|${u.name.toLowerCase()}`)),
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

  // Praksis places connected to this placement — the places with limits for this emne plus any
  // a student is already assigned to. Used by the StudentsPanel assignment filter.
  const connectedPraksisPlaces = useMemo(() => {
    const byId = new Map<string, string>();
    quotas.forEach((q) => q.placeId && byId.set(q.placeId, q.placeName));
    limitTrees.forEach((t) => byId.set(t.praksisPlaceId, t.praksisPlaceName));
    students.forEach((s) => {
      const a = s.assignedPraksisPlace;
      if (a?.placeId) byId.set(a.placeId, a.placeName);
    });
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [quotas, limitTrees, students]);

  const totalQuotas = totalLimitPlaces;
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

  // Praksis places with usable units, for the per-student assign dialog. Every unit shows the
  // places left there; full ones are disabled in the dialog.
  const getAvailableQuotaRequests = (): QuotaRequestOption[] =>
    limitTrees.map((t) => {
      const left = t.nodes.filter((n) => n.depth === 0).reduce((sum, n) => sum + n.remaining, 0);
      return {
        id: t.praksisPlaceId,
        praksisPlaceId: t.praksisPlaceId,
        praksisPlaceName: t.praksisPlaceName,
        departmentId: "",
        departmentName: "",
        requestedCapacity: left,
        startDate: quotaContext.startDate,
        endDate: metadataFormData.endDate || placement.endDate,
        emne: quotaContext.emne,
        studyId: quotaContext.studyId,
        programId: quotaContext.programId,
        assignedCount: 0,
        availableCount: left,
        _quotaRequestId: "",
        units: t.units.map((u) => ({
          id: u.id,
          name: u.name,
          depth: u.depth,
          remaining: u.effectiveRemaining,
          limitingName: u.limitingName,
        })),
      };
    });

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

  // Tell the user which limits the chosen emne can use
  const notifyLimits = (m: typeof quotaContext) => {
    const trees = limitTreeForPlacement(allLimits, praksisPlaces, m, students, allPlacementsData);
    if (trees.length === 0) {
      toast.info(`No limit for ${m.emne || "this emne"} yet`, {
        description: "Add one under Praksis places → Limits to start assigning students.",
      });
      return;
    }
    const places = trees.map((t) => t.praksisPlaceName);
    const n = trees.reduce((sum, t) => sum + t.nodes.length, 0);
    toast.success(`${n} limit${n > 1 ? "s" : ""} available for ${m.emne}`, {
      description: `${places.join(", ")} — shown in Available limits for this placement.`,
    });
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

    notifyLimits({
      studyId: metadataFormData.studyId,
      programId: metadataFormData.programId,
      emne: metadataFormData.subject,
      startDate: metadataFormData.startDate,
      year: metadataFormData.year,
      semester: metadataFormData.semester,
    });

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
        undefined, // only the unit is stored — limit usage is worked out from where students are
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
    _requestId: string,
    entityId?: string,
  ) => {
    // Only the unit is stored — limit usage is worked out from where students are placed
    handleAssignStudent(studentId, placeId, deptId, false, undefined, entityId);
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

  // Students are drawn under the nearest limit above the unit they're placed in
  const networkDiagramStudents = students.map((s) => {
    const a = s.assignedPraksisPlace;
    const unit = a
      ? limitTrees
          .find((t) => t.praksisPlaceId === a.placeId)
          ?.units.find((u) => u.id === (a.entityId ?? a.departmentId))
      : undefined;
    return {
      id: s.id,
      name: s.name,
      assignedPlace: a
        ? {
            placeId: a.placeId,
            placeName: a.placeName,
            departmentId: unit ? unit.governingNodeId : a.departmentId,
            departmentName: unit ? unit.governingName : a.departmentName,
            quotaRequestId: unit?.governingLimitId,
            entityId: unit ? unit.governingNodeId : a.entityId,
          }
        : undefined,
    };
  });

  const placementProgramId = metadataFormData.programId || placement.programId;
  const placementEmne = quotaContext.emne;

  const networkDiagramQuotas = limitTrees.flatMap((t) =>
    t.nodes.map((n) => ({
      requestId: n.limit.id,
      placeId: t.praksisPlaceId,
      placeName: t.praksisPlaceName,
      departmentId: n.limit.entityId,
      departmentName: n.limit.entityName,
      currentAssigned: n.used,
      quota: n.share - n.usedElsewhere,
      status: "approved",
    })),
  );

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
          <div className="px-8 py-4 max-w-3xl">
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900">
                Welcome! Let's Get Started
              </AlertTitle>
              <AlertDescription className="text-blue-800">
                Fill in the placement details below. Students can only be placed with Praksis place
                limits that include the selected emne.
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
            // New placements always start blank
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
                      Not enough places
                    </AlertTitle>
                    <AlertDescription className="text-amber-800">
                      You have {students.length} students but the limits for this emne
                      only have {totalQuotas} place{totalQuotas !== 1 ? "s" : ""} for this
                      placement. Raise or add limits under Praksis places → Limits for{" "}
                      {students.length - totalQuotas} more.
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
                    The limits for this emne have {totalQuotas} place
                    {totalQuotas !== 1 ? "s" : ""} for this placement. Import students to continue
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
                {/* Left panel: Available limits (sticky sidebar) */}
                {!isStudentsExpanded && (
                  <div className="w-[400px] flex-shrink-0 sticky top-6 max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    <AvailableLimitsPanel
                      trees={limitTrees}
                      violations={limitRuleViolations}
                      students={students}
                      emne={placementEmne}
                      hasPlacementDetails={!!(placementProgramId && placementEmne)}
                      isPublished={isFirstPublishCompleted}
                      readOnly={isAssignmentPublished}
                      onQuickAssign={handleQuickAssign}
                      onPublishRequired={() => setShowPublishWarning(true)}
                      onOpenLimits={onRequestQuota}
                      onEditLimit={
                        placementEmneRef
                          ? (limitId) => {
                              const limit = allLimits.find((l) => l.id === limitId);
                              if (limit) setEditingLimit(limit);
                            }
                          : undefined
                      }
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
                    connectedPraksisPlaces={connectedPraksisPlaces}
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

        {editingLimit && (
          <AddLimitModal
            place={praksisPlaces.find((p) => p.id === editingLimit.praksisPlaceId)}
            entity={{ id: editingLimit.entityId, name: editingLimit.entityName }}
            existingLimits={allLimits}
            studies={studies}
            fixedEmne={placementEmneRef}
            editingLimit={editingLimit}
            onClose={() => setEditingLimit(null)}
            onSave={(saved) => {
              savePraksisLimits(saved);
              toast.success("Limit updated");
            }}
          />
        )}

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
