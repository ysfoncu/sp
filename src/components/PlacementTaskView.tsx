import { useState, useEffect, useRef, useMemo } from "react";
import { Info, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { StudentPlacement } from "../types/studentPlacement";
import { Study, findEmneByName } from "../types/studyCatalog";
import { PraksisPlace } from "../types/praksisPlace";
import {
  Student,
  PlacementTask,
  placementTasks,
} from "../types/placementTask";
import { StudentRow, claimStudents, derivePlacementWindow, toPlacementStudent, waitingForEmne, waitingLocations } from "../types/praksisStudent";
import { OtherPlacementUsage } from "../types/profileUsage";
import { PlacementProfile, ResolvedContact, linkContact, placementEmneId, resolveAssignmentProfile, resolveContacts, usePlacementProfiles } from "../types/placementProfile";
import { MentorPicker } from "./MentorPicker";
import { PreviewEntry, StudentPreviewDialog } from "./StudentPreviewDialog";
import { StudentView, buildStudentView, missingInfo, takeSnapshot, viewChangedSince } from "../types/studentView";
import { mentorState, peopleToNotify, studentsNeedingMentor } from "../types/profileRules";
import { addPlaceContact, usePlaceContacts } from "../types/placeContact";
import { nodeCapacity, profileTreeForPlacement, totalPlacesForPlacement } from "../types/profileUsage";
import { PriorityPlacementPeriod, PriorityPlacementApplication } from "../types/priorityPlacement";
import { toast } from "sonner@2.0.3";
import AvailableProfilesPanel from "./AvailableProfilesPanel";
import { PlacementTaskHeader } from "./PlacementTaskHeader";
import PlacementEntitySlotsStep from "./PlacementEntitySlotsStep";
import { StepInfoBanner } from "./StepInfoBanner";
import { PublishState, canPublishToStudents, isLocked, normalizePublish, publishState } from "../types/publishState";
import { EntitySlot, slotCandidates, slotsFromTrees } from "../types/placementSlots";
import { PlacementMetadataForm, MetadataFormData, placementTitleFor } from "./PlacementMetadataForm";
import { AssignmentPublishBanner } from "./AssignmentPublishBanner";
import { StudentsPanel } from "./StudentsPanel";
import { unassignedOf } from "../types/entityPicker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { PlacementModals, QuotaRequestOption } from "./PlacementModals";

interface PlacementTaskViewProps {
  placement: StudentPlacement;
  praksisPlaces: PraksisPlace[];
  studies: Study[];
  onBack: () => void;
  isAISidebarOpen?: boolean;
  onAISidebarChange?: (isOpen: boolean) => void;
  onPlacementStatusUpdate?: (
    placementId: string,
    status: "draft" | "upload" | "select" | "publish" | "completed",
  ) => void;
  // Every Praksis-students student with their state; the placement takes the ones waiting for its emne
  registryRows?: StudentRow[];
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
      emneId?: string;
      location?: string;
      totalPraksisHours?: number;
    },
  ) => void;
  onPlacementDelete?: (placementId: string) => void;
  // Opens Praksis places, where limits are added
  onOpenPraksisPlaces?: () => void;
  // Opens the page to edit an entity on Praksis places
  initialTaskState?: {
    placementId: string;
    studentsImported: boolean;
    students: any[];
    studentsAssigned: boolean;
    documentsAttached: boolean;
    finalPublished: boolean;
    completedTasks: string[];
    assignmentPublished?: boolean;
    assignmentPublishedDate?: string;
    entitiesPublished?: boolean;
    entitiesPublishedDate?: string;
  };
  onTaskStateUpdate?: (state: any) => void;
  allPlacementsData?: OtherPlacementUsage[];
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
  studies,
  onBack,
  isAISidebarOpen = false,
  onAISidebarChange,
  onPlacementStatusUpdate,
  onPlacementMetadataUpdate,
  registryRows = [],
  onPlacementDelete,
  onOpenPraksisPlaces,
  initialTaskState,
  onTaskStateUpdate,
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
          emneId: findEmneByName(prefillData.programId, prefillData.subject)?.id,
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

  // ── Entities and slots (step 2) ──────────────────────────────────────────
  // The entities this placement uses and their slots; undefined = every fitting entity (placements made
  // before the step existed). The students are shown once the step is confirmed.
  const [entitySlots, setEntitySlots] = useState<EntitySlot[] | undefined>(initialTaskState?.entitySlots);
  const [slotsConfirmed, setSlotsConfirmed] = useState<boolean>(
    initialTaskState?.entitySlotsConfirmed ?? (initialTaskState?.entitySlots === undefined && placement.status !== "draft"),
  );

  // ── Core data state ──────────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>(
    initialTaskState?.students || [],
  );
  const [tasks, setTasks] = useState<PlacementTask[]>(placementTasks);
  const [studentsImported, setStudentsImported] = useState(
    initialTaskState?.studentsImported || false,
  );

  // ── UI layout state ──────────────────────────────────────────────────────
  const [isStudentsExpanded, setIsStudentsExpanded] = useState(false);

  // ── Assignment publish state ─────────────────────────────────────────────
  // Two publish steps: to entities (task 7), then to students (task 8). A state saved with the single publish
  // step counts as published to both.
  const initialPublish = initialTaskState ? normalizePublish(initialTaskState) : undefined;
  const [isEntitiesPublished, setIsEntitiesPublished] = useState(initialPublish?.entitiesPublished ?? false);
  const [entitiesPublishedDate, setEntitiesPublishedDate] = useState<string | null>(initialPublish?.entitiesPublishedDate ?? null);
  const [isAssignmentPublished, setIsAssignmentPublished] = useState(initialPublish?.assignmentPublished ?? false); // to students
  const [assignmentPublishedDate, setAssignmentPublishedDate] = useState<string | null>(initialPublish?.assignmentPublishedDate ?? null);
  // What was published when Edit was pressed, so "Cancel edit" can give it back
  const [publishedBeforeEdit, setPublishedBeforeEdit] = useState<PublishState | null>(null);
  const publishStatus = publishState({ entitiesPublished: isEntitiesPublished, assignmentPublished: isAssignmentPublished });
  // Anything published locks the assignments (Edit unlocks them)
  const locked = isLocked(publishStatus);
  const [showCongratulations, setShowCongratulations] = useState(false);

  // ── Modal / dialog open state ────────────────────────────────────────────
  const [isTasksModalOpen, setIsTasksModalOpen] = useState(false);
  const [isQuotaSelectionDialogOpen, setIsQuotaSelectionDialogOpen] =
    useState(false);
  const [publishMode, setPublishMode] = useState<"entities" | "students" | null>(null); // the publish step being confirmed
  const [isNetworkDiagramOpen, setIsNetworkDiagramOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isHelpOverlayOpen, setIsHelpOverlayOpen] = useState(false);
  // Edit a profile without leaving the placement (profiles are made on Praksis places)

  // ── Placing students ─────────────────────────────────────────────────────
  // The entity the students picked in the Students table will be placed on (its profile id), or null
  const [assignTargetId, setAssignTargetId] = useState<string | null>(null);
  const [isAssignHintOpen, setIsAssignHintOpen] = useState(false);
  // Students ticked in the table, and the entity chosen for them (students first); the table and the entity
  // cards both need them
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [pickedEntityId, setPickedEntityId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // ── Refs ─────────────────────────────────────────────────────────────────
  const hasInitialized = useRef(false);
  const onTaskStateUpdateRef = useRef(onTaskStateUpdate);
  useEffect(() => {
    onTaskStateUpdateRef.current = onTaskStateUpdate;
  }, [onTaskStateUpdate]);

  // Students waiting in Praksis-students for the emne chosen in the form
  // (only those at the chosen location, when one is chosen)
  const waitingForChosenEmne = metadataFormData.emneId
    ? waitingForEmne(registryRows, metadataFormData.emneId, undefined, metadataFormData.location)
    : [];
  const locationOptions = metadataFormData.emneId ? waitingLocations(registryRows, metadataFormData.emneId) : [];

  // ── Computed stats ───────────────────────────────────────────────────────
  const placementsMadeCount = students.filter(
    (s) => s.assignedPraksisPlace,
  ).length;
  const placementsPendingCount = students.length - placementsMadeCount;
  // The placement's program/emne and period — only Praksis place limits that include this emne
  // can be used, counted per limit period across placements
  const quotaContext = {
    studyId: metadataFormData.studyId || placement.studyId,
    programId: metadataFormData.programId || placement.programId,
    emne: metadataFormData.subject || placement.subject,
    emneId: metadataFormData.emneId || placement.emneId,
    startDate: metadataFormData.startDate || placement.startDate,
    year: metadataFormData.year || placement.year,
    semester: metadataFormData.semester || placement.semester,
  };

  const allProfiles = usePlacementProfiles();
  const placeContacts = usePlaceContacts();
  // Profiles that fit this placement's program and emne, per praksis place, with usage worked out from
  // where students are placed — here and in other placements the profile also covers in the same period
  const profileTrees = profileTreeForPlacement(allProfiles, praksisPlaces, quotaContext, students, allPlacementsData, entitySlots);
  // Every entity that fits, for the step where the entities are chosen
  const slotChoices = slotsConfirmed ? [] : slotCandidates(profileTreeForPlacement(allProfiles, praksisPlaces, quotaContext, students, allPlacementsData));

  // Places this placement can use: every fitting profile's places minus what other placements used
  const totalLimitPlaces = totalPlacesForPlacement(profileTrees);

  // "place|unit" for every unit a fitting profile covers — used to flag earlier placements at the same unit
  const quotaEntityKeys = new Set<string>(
    profileTrees.flatMap((t) => t.units.map((u) => `${t.praksisPlaceName.toLowerCase()}|${u.name.toLowerCase()}`)),
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
    profileTrees.forEach((t) => byId.set(t.praksisPlaceId, t.praksisPlaceName));
    students.forEach((s) => {
      const a = s.assignedPraksisPlace;
      if (a?.placeId) byId.set(a.placeId, a.placeName);
    });
    return Array.from(byId, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [profileTrees, students]);

  const totalQuotas = totalLimitPlaces;
  const currentTask = tasks.find((t) => !t.completed);
  // The step the info banner explains: the first mandatory task not done (the optional steps have no banner, and
  // once everything is published there is none)
  const bannerTask = tasks.find((t) => !t.completed && t.status === "mandatory");
  const allStudentsAssigned =
    students.length > 0 && students.every((s) => s.assignedPraksisPlace);

  // The profiles with places left, for the AI helper
  const availableProfileUnits = profileTrees.flatMap((t) =>
    t.nodes.map((n) => ({
      placeId: t.praksisPlaceId,
      placeName: t.praksisPlaceName,
      departmentId: n.profile.id,
      departmentName: n.profile.name,
      fixedQuota: n.places,
      assignedCount: n.used,
      availableCount: n.remaining,
    })),
  );

  // Praksis places with usable units, for the per-student assign dialog. Every unit shows the
  // places left there; full ones can still be picked and show how many are over.
  const getAvailableQuotaRequests = (): QuotaRequestOption[] =>
    profileTrees.map((t) => {
      const left = t.nodes.reduce((sum, n) => sum + n.remaining, 0);
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
        _profileId: "",
        units: t.units.map((u) => ({
          id: u.id,
          name: u.name,
          depth: 0,
          remaining: u.remaining,
          over: t.nodes.find((n) => n.profile.id === u.profileId)?.over ?? 0,
          limitingName: u.profileName,
          profileId: u.profileId,
          profileName: u.profileName,
        })),
      };
    });

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleTaskAction = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.actionType === "mark") {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, completed: true } : t)),
      );
    } else if (task.actionType === "publish") {
      if (task.id === "7" || task.id === "8") {
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

  // Tell the user which profiles the chosen emne can use
  const notifyProfiles = (m: typeof quotaContext) => {
    const trees = profileTreeForPlacement(allProfiles, praksisPlaces, m, students, allPlacementsData);
    if (trees.length === 0) {
      toast.info(`No entity for ${m.emne || "this emne"} yet`, {
        description: "Add one under Praksis places to start assigning students.",
      });
      return;
    }
    const places = trees.map((t) => t.praksisPlaceName);
    const n = trees.reduce((sum, t) => sum + t.nodes.length, 0);
    toast.success(`${n} entit${n > 1 ? "ies" : "y"} available for ${m.emne}`, {
      description: `${places.join(", ")} — shown in Available entities for this placement.`,
    });
  };

  const handleMetadataFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // The placement takes the students waiting for this emne; its period follows theirs
    const taken = waitingForChosenEmne;
    const period = derivePlacementWindow(taken);
    if (!period) return;
    const claimed = new Set(claimStudents(taken.map((s) => s.id), placement.id));
    const incoming = taken.filter((s) => claimed.has(s.id)).map(toPlacementStudent);
    setStudents(incoming);
    setStudentsImported(true);
    // Next the entities and their slots are chosen; the students are shown after that
    setEntitySlots([]);
    setSlotsConfirmed(false);
    const title = metadataFormData.title.trim() || placementTitleFor(studies, metadataFormData);
    const filled = { ...metadataFormData, title, ...period, students: incoming.length };
    setMetadataFormData(filled);

    if (onPlacementMetadataUpdate) {
      onPlacementMetadataUpdate(placement.id, {
        title,
        year: period.year,
        semester: period.semester,
        subject: filled.subject,
        startDate: period.startDate,
        endDate: period.endDate,
        students: incoming.length,
        studyId: filled.studyId,
        programId: filled.programId,
        emneId: filled.emneId,
        location: filled.location || undefined,
      });
    }

    if (onPlacementStatusUpdate && placement.status === "draft") {
      onPlacementStatusUpdate(placement.id, "upload");
    }

    notifyProfiles({
      studyId: metadataFormData.studyId,
      programId: metadataFormData.programId,
      emne: metadataFormData.subject,
      emneId: metadataFormData.emneId,
      startDate: period.startDate,
      year: period.year,
      semester: period.semester,
    });

    if (onboardingStep === 3 && setOnboardingStep) {
      setOnboardingStep(0);
    }
  };

  // Back to the entities step; a placement made without slots starts from every fitting entity
  const handleChangeEntities = () => {
    if (!entitySlots) setEntitySlots(slotsFromTrees(profileTrees));
    setSlotsConfirmed(false);
  };

  const handleCancelDraft = () => {
    if (placement.status === "draft" && onPlacementDelete) {
      onPlacementDelete(placement.id);
    }
    onBack();
  };

  // The one way a student gets placed. The student lands on a profile (the one given, else the one
  // at the unit that takes this placement's program and emne) and the unit follows from it.
  const handleAssignStudent = (
    studentId: string,
    placeId: string,
    departmentId: string,
    requestApproval?: boolean,
    profileId?: string,
    entityId?: string,
  ) => {
    const place = praksisPlaces.find((p) => p.id === placeId);

    if (!place) {
      toast.error("Could not find the selected praksis place");
      return;
    }

    // The student goes to an entity of the place; its id is the profile id
    const entityRef = profileId ?? entityId ?? departmentId;
    if (!allProfiles.some((p) => p.id === entityRef && p.praksisPlaceId === placeId)) {
      toast.error("Could not find the selected entity");
      return;
    }

    const emneId = placementEmneId({
      programId: quotaContext.programId,
      subject: quotaContext.emne,
      emneId: quotaContext.emneId,
    });
    const profile = resolveAssignmentProfile(
      allProfiles,
      { placeId, unitId: entityRef, profileId },
      { programId: quotaContext.programId, emneId },
    );

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? {
              ...s,
              assignedPraksisPlace: {
                placeId,
                placeName: place.name,
                departmentId: entityRef,
                departmentName: profile?.name ?? "",
                entityId: entityRef,
                placementTaskId: placement.id,
                profileId: profile?.id,
                emneId,
                status: "planned" as const,
                startDate: (s.praksisStartDate ?? placement.startDate),
                endDate: (s.praksisEndDate ?? placement.endDate),
                placementTitle: placement.title,
                assignedDate: new Date().toISOString(),
              },
            }
          : s,
      ),
    );
  };

  // ── Mentors ──────────────────────────────────────────────────────────────
  // The profile a placed student sits on (archived ones included)
  const profileOf = (student: Student): PlacementProfile | undefined => {
    const a = student.assignedPraksisPlace;
    if (!a) return undefined;
    return resolveAssignmentProfile(
      allProfiles,
      { placeId: a.placeId, unitId: a.entityId ?? a.departmentId, profileId: a.profileId },
      {
        programId: quotaContext.programId,
        emneId: placementEmneId({ programId: quotaContext.programId, subject: quotaContext.emne, emneId: quotaContext.emneId }),
      },
    );
  };

  // One mentor per placement, picked from the entity's contacts.
  const setMentor = (student: Student, contact: { id: string; name: string; type: "supervisor" | "contact" }) =>
    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id && s.assignedPraksisPlace
          ? {
              ...s,
              supervisor: { id: contact.id, name: contact.name },
              assignedPraksisPlace: {
                ...s.assignedPraksisPlace,
                mentor: { personType: contact.type, personId: contact.id, name: contact.name },
              },
            }
          : s,
      ),
    );

  const handleAssignMentor = (student: Student, contact: ResolvedContact) => {
    setMentor(student, contact);
    toast.success(`${contact.name} is now the mentor of ${student.name}`);
  };

  // A person typed in on the spot becomes a contact of the entity first, then the mentor
  const handleAddMentorContact = (student: Student, person: { name: string; role: string; email: string; phone: string }) => {
    const profile = profileOf(student);
    if (!profile) return;
    const created = addPlaceContact({ praksisPlaceId: profile.praksisPlaceId, type: "supervisor", ...person });
    linkContact(profile.id, created.id);
    handleAssignMentor(student, { ...created, notifyOnPlacement: true, availableToStudents: true });
  };

  const handleClearMentor = (student: Student) =>
    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id && s.assignedPraksisPlace
          ? { ...s, supervisor: undefined, assignedPraksisPlace: { ...s.assignedPraksisPlace, mentor: undefined } }
          : s,
      ),
    );

  const renderMentor = (student: Student) => {
    const profile = profileOf(student);
    return (
      <MentorPicker
        mentor={student.assignedPraksisPlace?.mentor}
        state={mentorState(student.assignedPraksisPlace?.mentor, profile)}
        profileName={profile?.name}
        contacts={profile ? resolveContacts(profile, placeContacts) : []}
        onChoose={(contact) => handleAssignMentor(student, contact)}
        onAddContact={(person) => handleAddMentorContact(student, person)}
        onClear={() => handleClearMentor(student)}
      />
    );
  };

  const needsMentorCount = studentsNeedingMentor(students).length;
  // The contacts that would be told when the assignments are published: those of the profiles in use
  const notifyList = (() => {
    const inUse = new Set(students.map((s) => profileOf(s)?.id).filter(Boolean) as string[]);
    return peopleToNotify(allProfiles.filter((p) => inUse.has(p.id)), placeContacts).map((n) => ({
      key: `${n.profileId}:${n.personId}`,
      profileName: n.profileName,
      name: n.name,
    }));
  })();

  // ── What students receive ────────────────────────────────────────────────
  // The view of a placed student from the profile as it is now (undefined without a profile)
  const liveViewOf = (student: Student): StudentView | undefined => {
    const a = student.assignedPraksisPlace;
    const profile = profileOf(student);
    return a && profile ? buildStudentView(profile, a, placeContacts) : undefined;
  };

  const placedStudents = students.filter(
    (s) => s.assignedPraksisPlace && s.assignedPraksisPlace.status !== "cancelled",
  );

  // Published students show what they were told; the others show the profile as it is now
  const previewEntries: PreviewEntry[] = placedStudents.map((s) => {
    const snap = s.assignedPraksisPlace?.snapshot;
    const live = liveViewOf(s);
    return {
      studentId: s.id,
      studentName: s.name,
      view: snap ? snap.view : live,
      source: snap ? "published" : "live",
      changed: viewChangedSince(snap, live),
      publishedAt: snap?.takenAt,
      version: snap?.version,
    };
  });

  const changedSincePublish = (student: Student) =>
    viewChangedSince(student.assignedPraksisPlace?.snapshot, liveViewOf(student));
  const changedCount = placedStudents.filter(changedSincePublish).length;

  // Information still missing on the profiles in use, listed in the publish dialog
  const infoWarnings = (() => {
    const seen = new Set<string>();
    const out: string[] = [];
    placedStudents.forEach((s) => {
      const p = profileOf(s);
      if (!p || seen.has(p.id)) return;
      seen.add(p.id);
      const missing = missingInfo(p.info);
      if (missing.length > 0) out.push(`${p.name}: missing ${missing.join(", ")}`);
    });
    return out;
  })();

  // Takes a fresh snapshot for the given students (all placed students when none are given)
  const snapshotStudents = (only?: Set<string>) =>
    setStudents((prev) =>
      prev.map((s) => {
        const a = s.assignedPraksisPlace;
        if (!a || a.status === "cancelled" || (only && !only.has(s.id))) return s;
        const profile = profileOf(s);
        const view = liveViewOf(s);
        return profile && view ? { ...s, assignedPraksisPlace: { ...a, snapshot: takeSnapshot(profile, view) } } : s;
      }),
    );

  const handleUpdatePublished = () => {
    snapshotStudents(new Set(placedStudents.filter(changedSincePublish).map((s) => s.id)));
    toast.success("Published information updated");
  };

  // StudentsPanel file-operation callbacks
  // Takes one student off the entity from the Available entities panel, with an Undo
  const removeFromEntity = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    const assignment = student?.assignedPraksisPlace;
    if (!student || !assignment) return;
    handleDetachStudent(studentId);
    toast.success(`Took ${student.name} off ${assignment.departmentName || assignment.placeName}`, {
      duration: 10000,
      action: {
        label: "Undo",
        onClick: () => undoBatch(new Map([[studentId, assignment]]), (s) => !s.assignedPraksisPlace),
      },
    });
  };

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

  const stamp = () =>
    new Date().toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // Step 1: the entities. It records that they can see the placement (nothing is built on their side) and locks
  // the assignments; the students are not told yet, so the assignments stay planned
  const handlePublishToEntities = () => {
    setIsEntitiesPublished(true);
    setEntitiesPublishedDate(stamp());
    setPublishedBeforeEdit(null);
    setPublishMode(null);
    toast.success("Published to entities");
  };

  // Step 2: the students, only after the entities. It books every assignment and freezes what each student is told
  const handlePublishToStudents = () => {
    if (!canPublishToStudents(publishStatus)) return;
    const now = stamp();
    setStudents((prev) =>
      prev.map((s) => {
        const a = s.assignedPraksisPlace;
        if (!a || a.status === "cancelled") return s;
        const profile = profileOf(s);
        const view = liveViewOf(s);
        return {
          ...s,
          assignedPraksisPlace: {
            ...a,
            status: "booked" as const,
            snapshot: profile && view ? takeSnapshot(profile, view) : a.snapshot,
          },
        };
      }),
    );
    setIsAssignmentPublished(true);
    setAssignmentPublishedDate(now);
    setPublishedBeforeEdit(null);
    setPublishMode(null);
    toast.success("Published to students");
  };

  const handlePublishConfirm = () => (publishMode === "entities" ? handlePublishToEntities() : handlePublishToStudents());

  // Edit unlocks the assignments (both publish steps are open again); Cancel edit gives back what was published
  const handleEditPublished = () => {
    setPublishedBeforeEdit(publishStatus);
    setIsAssignmentPublished(false);
    setIsEntitiesPublished(false);
  };
  const handleCancelEdit = () => {
    if (!publishedBeforeEdit) return;
    setIsEntitiesPublished(publishedBeforeEdit !== "none");
    setIsAssignmentPublished(publishedBeforeEdit === "students");
    setPublishedBeforeEdit(null);
  };

  // Gives the assignments of the students back as they were, for the ones that still hold what a batch gave them
  // (a student changed by hand since is left as it is)
  const undoBatch = (before: Map<string, Student["assignedPraksisPlace"]>, current: (s: Student) => boolean) =>
    setStudents((prev) => prev.map((s) => (before.has(s.id) && current(s) ? { ...s, assignedPraksisPlace: before.get(s.id) } : s)));

  // The entities students can be placed on, with the places left on each (full ones included: places never block)
  const assignOptions = useMemo(
    () =>
      profileTrees.flatMap((t) =>
        t.nodes.map((n) => ({
          id: n.profile.id,
          name: n.profile.name,
          praksisPlaceId: t.praksisPlaceId,
          praksisPlaceName: t.praksisPlaceName,
          remaining: n.remaining,
          over: n.over,
        })),
      ),
    [profileTrees],
  );
  const assignTarget = assignOptions.find((o) => o.id === assignTargetId) ?? null;
  const selectedFreeCount = useMemo(() => unassignedOf(selectedStudents, students).length, [selectedStudents, students]);
  // The choice goes when nothing is ticked any more, or when the + of the entity-first flow takes over
  useEffect(() => {
    if (selectedFreeCount === 0 || assignTargetId !== null) setPickedEntityId(null);
  }, [selectedFreeCount, assignTargetId]);
  // The + of an entity card: with students ticked it chooses that entity for them (students first); without, it
  // starts the entity-first flow
  const pressPlus = (profileId: string) => {
    if (selectedFreeCount > 0 && assignTargetId === null) setPickedEntityId(profileId);
    else startAssign(profileId);
  };

  const ASSIGN_HINT_KEY = "spm_assign_hint_hidden";
  const startAssign = (profileId: string) => {
    const wasOn = assignTargetId !== null;
    setAssignTargetId(profileId);
    if (!wasOn) {
      let hidden = false;
      try {
        hidden = localStorage.getItem(ASSIGN_HINT_KEY) === "1";
      } catch {
        // Storage unavailable: show the hint
      }
      if (!hidden) setIsAssignHintOpen(true);
    }
  };
  const hideAssignHintForGood = () => {
    try {
      localStorage.setItem(ASSIGN_HINT_KEY, "1");
    } catch {
      // Storage unavailable: the hint comes back next time
    }
    setIsAssignHintOpen(false);
  };
  const cancelAssign = () => {
    const id = assignTargetId;
    setAssignTargetId(null);
    // Focus goes back to the entity's button
    setTimeout(() => document.querySelector<HTMLElement>(`[data-assign-target="${id}"]`)?.focus(), 0);
  };

  // Escape leaves the placing mode
  useEffect(() => {
    if (assignTargetId === null || isAssignHintOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !(e.target instanceof HTMLElement && e.target.closest("[role=dialog], [role=listbox]"))) cancelAssign();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [assignTargetId, isAssignHintOpen]);

  // The mode ends when its entity is gone (the assignments were published, the placement changed)
  useEffect(() => {
    if (assignTargetId !== null && !assignTarget) setAssignTargetId(null);
  }, [assignTargetId, assignTarget]);

  // Places the picked students on the target entity; the mode stays on for the next batch
  const handleAddToTarget = (studentIds: string[], targetId?: string) => {
    // The entity can be given (picked in the students-first bar) or is the one the + chose
    const target = targetId ? assignOptions.find((o) => o.id === targetId) ?? null : assignTarget;
    if (!target) {
      if (targetId) toast.error("That entity is no longer available");
      return;
    }
    // Only students that still have no entity (one may have been placed elsewhere since it was picked)
    const free = studentIds.filter((id) => !students.find((s) => s.id === id)?.assignedPraksisPlace);
    if (free.length === 0) return;
    const before = new Map(free.map((id) => [id, students.find((s) => s.id === id)?.assignedPraksisPlace]));
    free.forEach((studentId) => {
      handleAssignStudent(studentId, target.praksisPlaceId, target.id, false, target.id, target.id);
    });
    const count = free.length;
    const skipped = studentIds.length - free.length;
    toast.success(
      `Placed ${count} student${count !== 1 ? "s" : ""} on ${target.praksisPlaceName} - ${target.name}`,
      {
        description: skipped > 0 ? `${skipped} already had an entity and ${skipped === 1 ? "was" : "were"} left as they were.` : undefined,
        duration: 15000,
        action: {
          label: "Undo",
          onClick: () =>
            undoBatch(before, (s) => s.assignedPraksisPlace?.profileId === target.id && s.assignedPraksisPlace?.status === "planned"),
        },
      },
    );
  };

  const handleAssignStudentToQuota = (
    studentId: string,
    placeId: string,
    deptId: string,
    profileId: string,
    entityId?: string,
  ) => {
    handleAssignStudent(studentId, placeId, deptId, false, profileId, entityId);
    setIsQuotaSelectionDialogOpen(false);
    setSelectedStudent(null);
  };

  const handleNetworkAssignStudent = (
    studentId: string,
    placeId: string,
    departmentId: string,
    _placeName: string,
    _departmentName: string,
    profileId?: string, // the diagram hands over the profile it drew the student under
  ) => {
    handleAssignStudent(studentId, placeId, departmentId, false, profileId, departmentId);
  };

  const handleNetworkUnassignStudent = (studentId: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId ? { ...s, assignedPraksisPlace: undefined } : s,
      ),
    );
  };

  const handleAIAction = (action: string, data: any) => {
    if (action === "assign_student") {
      // Place the student on the named entity if it still has places
      const entityName = String(data.department ?? "").toLowerCase();
      const hit = profileTrees
        .flatMap((t) => t.nodes.map((n) => ({ tree: t, node: n })))
        .find(({ node }) => node.profile.name.toLowerCase().includes(entityName) && node.remaining > 0);
      if (!hit) {
        toast.error(`No entity with free places called ${data.department}`);
        return;
      }
      handleAssignStudent(
        data.student.id,
        hit.tree.praksisPlaceId,
        hit.node.profile.id,
        false,
        hit.node.profile.id,
        hit.node.profile.id,
      );
    }
  };

  // ── Effects ───────────────────────────────────────────────────────────────

  // Auto-complete Step 1/6 when the students have come in (places never block, so they are not checked here)
  useEffect(() => {
    if (studentsImported && students.length > 0) {
      setTasks((prev) =>
        prev.map((t) => (t.id === "1" ? { ...t, completed: true } : t)),
      );
    }
  }, [studentsImported, students.length]);

  // Auto-complete or auto-uncomplete Step 3/6 based on assignment status
  useEffect(() => {
    if (!studentsImported || students.length === 0) return;
    const allAssigned = students.every((s) => s.assignedPraksisPlace);
    setTasks((prev) =>
      prev.map((t) => (t.id === "4" ? { ...t, completed: allAssigned } : t)),
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

  // Tasks 6/7 (entities) and 7/7 (students) follow what is published
  useEffect(() => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === "7" ? { ...t, completed: publishStatus !== "none" } : t.id === "8" ? { ...t, completed: publishStatus === "students" } : t,
      ),
    );
  }, [publishStatus]);

  // Step 2/7 is complete while the entities and slots are confirmed; "Change entities" opens it again
  useEffect(() => {
    setTasks((prev) => prev.map((t) => (t.id === "2" ? { ...t, completed: slotsConfirmed } : t)));
  }, [slotsConfirmed]);

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
        studentsAssigned: allAssigned,
        documentsAttached: tasks.find((t) => t.id === "5")?.completed || false,
        finalPublished: tasks.find((t) => t.id === "8")?.completed || false,
        completedTasks: completedTaskIds,
        assignmentPublished: isAssignmentPublished,
        assignmentPublishedDate: assignmentPublishedDate ?? undefined,
        entitiesPublished: isEntitiesPublished,
        entitiesPublishedDate: entitiesPublishedDate ?? undefined,
        entitySlots,
        entitySlotsConfirmed: slotsConfirmed,
      });
    }
  }, [
    entitySlots,
    slotsConfirmed,
    students,
    profileTrees.length,
    studentsImported,
    tasks,
    placement.id,
    isAssignmentPublished,
    assignmentPublishedDate,
    isEntitiesPublished,
    entitiesPublishedDate,
  ]);

  // ── Pre-computed modal data ───────────────────────────────────────────────

  // Students are drawn under the entity they're placed on
  const networkDiagramStudents = students.map((s) => {
    const a = s.assignedPraksisPlace;
    const unit = a
      ? profileTrees
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
            departmentId: unit ? unit.id : a.departmentId,
            departmentName: unit ? unit.name : a.departmentName,
            profileId: unit?.profileId,
            entityId: unit ? unit.id : a.entityId,
          }
        : undefined,
    };
  });

  const placementProgramId = metadataFormData.programId || placement.programId;
  const placementEmne = quotaContext.emne;

  const networkDiagramQuotas = profileTrees.flatMap((t) =>
    t.nodes.map((n) => ({
      requestId: n.profile.id,
      placeId: t.praksisPlaceId,
      placeName: t.praksisPlaceName,
      departmentId: n.profile.id,
      departmentName: n.profile.name,
      currentAssigned: n.used,
      quota: nodeCapacity(n),
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
          isAssignmentPublished={locked}
          studentCount={students.length}
          onBack={onBack}
          onOpenTasks={() => setIsTasksModalOpen(true)}
          onEdit={handleEditPublished}
          onHelp={() => setIsHelpOverlayOpen(true)}
        />

        {/* Draft placement info banner: step 1, the placement details */}
        {placement.status === "draft" && (
          <div className="px-8 py-4 max-w-3xl">
            <StepInfoBanner taskId="1" />
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
              waitingCount={waitingForChosenEmne.length}
              locations={locationOptions}
              onChange={setMetadataFormData}
              onSubmit={handleMetadataFormSubmit}
              onCancel={handleCancelDraft}
            />
          ) : !slotsConfirmed ? (
            // Step 2: the entities this placement uses and their slots, before the students are shown
            <div className="space-y-4 pt-6">
              <PlacementEntitySlotsStep
                candidates={slotChoices}
                slots={entitySlots ?? []}
                onChange={setEntitySlots}
                studentCount={students.length}
                emne={placementEmne}
                onContinue={() => setSlotsConfirmed(true)}
                onOpenProfiles={onOpenPraksisPlaces}
              />
            </div>
          ) : (
            <div className="space-y-4 pt-6">
              {/* Info banner of the step being worked on (once published to students there is none) */}
              {bannerTask && <StepInfoBanner key={bannerTask.id} taskId={bannerTask.id} />}

              {/* Validation alerts. Too few slots is not one: slots never block. Only having no entity at all is said. */}
              {!isStudentsExpanded && students.length > 0 && totalQuotas === 0 && !allStudentsAssigned && (
                <Alert className="bg-amber-50 border-amber-200">
                  <Info className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-900">No entities chosen</AlertTitle>
                  <AlertDescription className="text-amber-800">
                    No entities are chosen yet, so the {students.length} students cannot be placed. Use Change entities to choose entities and slots.
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
                    The entities for this emne have {totalQuotas} place
                    {totalQuotas !== 1 ? "s" : ""} for this placement. Import students to continue
                    with the placement process.
                  </AlertDescription>
                </Alert>
              )}

              {/* Assignment publish banner */}
              {studentsImported && allStudentsAssigned && students.length > 0 && (
                <AssignmentPublishBanner
                  publishState={publishStatus}
                  entitiesDate={entitiesPublishedDate}
                  studentsDate={assignmentPublishedDate}
                  canCancelEdit={publishedBeforeEdit !== null}
                  onPublishEntities={() => setPublishMode("entities")}
                  onPublishStudents={() => setPublishMode("students")}
                  onCancelEdit={handleCancelEdit}
                  needsMentor={needsMentorCount}
                  onPreview={() => setIsPreviewOpen(true)}
                  changedCount={changedCount}
                  onUpdatePublished={handleUpdatePublished}
                />
              )}

              {/* Split panel: profiles sidebar + students */}
              <div className="flex gap-4 items-start">
                {/* Left panel: Available profiles (sticky sidebar) */}
                {!isStudentsExpanded && (
                  <div className="w-[400px] flex-shrink-0 sticky top-6 max-h-[calc(100vh-220px)] overflow-y-auto rounded-lg border border-gray-200 bg-white">
                    <AvailableProfilesPanel
                      trees={profileTrees}
                      students={students}
                      emne={placementEmne}
                      hasPlacementDetails={!!(placementProgramId && placementEmne)}
                      readOnly={locked}
                      onStartAssign={pressPlus}
                      onRemoveStudent={removeFromEntity}
                      assignTargetId={assignTargetId}
                      selectedCount={selectedFreeCount}
                      pickedEntityId={pickedEntityId}
                      onOpenProfiles={onOpenPraksisPlaces}
                      onChangeEntities={handleChangeEntities}
                      totalStudents={students.length}
                      noneChosen={entitySlots !== undefined && entitySlots.length === 0}
                    />
                  </div>
                )}

                {/* Right panel: Students */}
                <div className="flex-1 min-w-0">
                  <StudentsPanel
                    students={students}
                    isAssignmentPublished={locked}
                    isStudentsExpanded={isStudentsExpanded}
                    quotaEntityKeys={quotaEntityKeys}
                    connectedPraksisPlaces={connectedPraksisPlaces}
                    priorityApplications={matchedPriorityApplications}
                    placesLeft={profileTrees.reduce((sum, t) => sum + t.nodes.reduce((n, node) => n + node.remaining, 0), 0)}
                    onStudentsExpandChange={setIsStudentsExpanded}
                    onDetachStudent={handleDetachStudent}
                    assignTarget={assignTarget}
                    assignOptions={assignOptions}
                    selectedStudents={selectedStudents}
                    onSelectedStudentsChange={setSelectedStudents}
                    pickedEntityId={pickedEntityId}
                    onPickEntity={setPickedEntityId}
                    onAddToTarget={handleAddToTarget}
                    onCancelAssign={cancelAssign}
                    onAttachFiles={handleAttachFiles}
                    onRemoveFile={handleRemoveFile}
                    onOpenQuotaDialog={(student) => {
                      setSelectedStudent(student);
                      setIsQuotaSelectionDialogOpen(true);
                    }}
                    onOpenNetworkDiagram={() => setIsNetworkDiagramOpen(true)}
                    renderMentor={renderMentor}
                    changedSincePublish={changedSincePublish}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {isPreviewOpen && <StudentPreviewDialog entries={previewEntries} onClose={() => setIsPreviewOpen(false)} />}

        {/* How placing works, shown when the mode starts unless it was switched off */}
        <Dialog open={isAssignHintOpen} onOpenChange={(open) => !open && setIsAssignHintOpen(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Place students on {assignTarget?.name ?? "this entity"}</DialogTitle>
              <DialogDescription className="pt-2 text-base">
                Select students in the Students list. A bar at the bottom of the page shows how many are selected and
                lets you add them to {assignTarget ? `${assignTarget.praksisPlaceName} - ${assignTarget.name}` : "the entity"}.
                The bar closes when they are added. Press another entity's button to change where they go, or Escape to stop.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button variant="ghost" onClick={hideAssignHintForGood}>
                Don't show this info again
              </Button>
              <Button onClick={() => setIsAssignHintOpen(false)} className="bg-blue-600 hover:bg-blue-700 text-white">
                Got it
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* All modals and overlays */}
        <PlacementModals
          isTasksModalOpen={isTasksModalOpen}
          onCloseTasksModal={() => setIsTasksModalOpen(false)}
          tasks={tasks}
          onTaskAction={handleTaskAction}
          publishMode={publishMode}
          onClosePublishConfirm={() => setPublishMode(null)}
          onPublishConfirm={handlePublishConfirm}
          needsMentorCount={needsMentorCount}
          notifyList={notifyList}
          infoWarnings={infoWarnings}
          isQuotaSelectionDialogOpen={isQuotaSelectionDialogOpen}
          selectedStudent={selectedStudent}
          availableQuotaRequests={getAvailableQuotaRequests()}
          onCloseQuotaSelection={() => {
            setIsQuotaSelectionDialogOpen(false);
            setSelectedStudent(null);
          }}
          onAssignStudentToQuota={handleAssignStudentToQuota}
          isAISidebarOpen={isAISidebarOpen}
          onCloseAISidebar={() => onAISidebarChange?.(false)}
          onAIAction={handleAIAction}
          availableDepartments={availableProfileUnits}
          aiStudents={students}
          aiTasks={tasks.map((t) => ({
            id: t.id,
            title: t.title,
            completed: t.completed,
          }))}
          aiCurrentTaskIndex={aiCurrentTaskIndex}
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
