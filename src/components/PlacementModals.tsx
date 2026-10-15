import {
  Building2,
  Calendar as CalendarIcon,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { PlacementTasksModal } from "./PlacementTasksModal";
import { AISupportSidebar } from "./AISupportSidebar";
import { PlacementNetworkDiagramModal } from "./PlacementNetworkDiagramModal";
import { PlacementTaskHelpOverlay } from "./PlacementTaskHelpOverlay";
import { Student, PlacementTask } from "../types/placementTask";
import { PraksisPlace } from "../types/praksisPlace";
import { PriorityPlacementApplication } from "../types/priorityPlacement";
import { toast } from "sonner@2.0.3";

export interface QuotaRequestOption {
  id: string;
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
  _profileId: string;
  _entityId?: string;
  // Limits: the units a student can be placed in, with the places left there (smallest remainder
  // over the limits on the unit's path) and the entity that sets it
  units?: Array<{
    id: string;
    name: string;
    depth: number;
    remaining?: number;
    over?: number; // students already placed beyond the places
    limitingName?: string;
    profileId?: string;
    profileName?: string;
  }>;
  periodLabel?: string;
}

interface NetworkDiagramStudent {
  id: string;
  name: string;
  assignedPlace?: {
    placeId: string;
    placeName: string;
    departmentId: string;
    departmentName: string;
    profileId?: string;
    entityId?: string;
  };
}

interface NetworkDiagramQuota {
  requestId: string;
  placeId: string;
  placeName: string;
  departmentId: string;
  departmentName: string;
  currentAssigned: number;
  quota: number;
  status: string;
}

interface PlacementModalsProps {
  // Tasks modal
  isTasksModalOpen: boolean;
  onCloseTasksModal: () => void;
  tasks: PlacementTask[];
  onTaskAction: (taskId: string) => void;

  // Publish confirm dialog
  // Which publish step the dialog confirms (null = closed)
  publishMode: "entities" | "students" | null;
  onClosePublishConfirm: () => void;
  onPublishConfirm: () => void;
  // Students placed without a mentor, and the contacts who would be told (nothing is sent in this prototype)
  needsMentorCount?: number;
  notifyList?: { key: string; profileName: string; name: string }[];
  // Profile information that is still empty (a warning, publishing is still allowed)
  infoWarnings?: string[];

  // Quota selection dialog (assign single student)
  isQuotaSelectionDialogOpen: boolean;
  selectedStudent: Student | null;
  availableQuotaRequests: QuotaRequestOption[];
  onCloseQuotaSelection: () => void;
  onAssignStudentToQuota: (
    studentId: string,
    placeId: string,
    deptId: string,
    requestId: string,
    entityId?: string,
  ) => void;

  // AI support sidebar
  isAISidebarOpen: boolean;
  onCloseAISidebar: () => void;
  onAIAction: (action: string, data: any) => void;
  availableDepartments: any[];
  aiStudents: Student[];
  aiTasks: Array<{ id: string; title: string; completed: boolean }>;
  aiCurrentTaskIndex: number;

  // Network diagram modal
  isNetworkDiagramOpen: boolean;
  onCloseNetworkDiagram: () => void;
  networkDiagramStudents: NetworkDiagramStudent[];
  networkDiagramQuotas: NetworkDiagramQuota[];
  placementTitle: string;
  onNetworkAssignStudent: (
    studentId: string,
    placeId: string,
    departmentId: string,
    placeName: string,
    departmentName: string,
    profileId?: string,
  ) => void;
  onNetworkUnassignStudent: (studentId: string) => void;

  // Help overlay
  isHelpOverlayOpen: boolean;
  onCloseHelp: () => void;
}

export function PlacementModals({
  isTasksModalOpen,
  onCloseTasksModal,
  tasks,
  onTaskAction,
  publishMode,
  onClosePublishConfirm,
  onPublishConfirm,
  needsMentorCount = 0,
  notifyList = [],
  infoWarnings = [],
  isQuotaSelectionDialogOpen,
  selectedStudent,
  availableQuotaRequests,
  onCloseQuotaSelection,
  onAssignStudentToQuota,
  isAISidebarOpen,
  onCloseAISidebar,
  onAIAction,
  availableDepartments,
  aiStudents,
  aiTasks,
  aiCurrentTaskIndex,
  isNetworkDiagramOpen,
  onCloseNetworkDiagram,
  networkDiagramStudents,
  networkDiagramQuotas,
  placementTitle,
  onNetworkAssignStudent,
  onNetworkUnassignStudent,
  isHelpOverlayOpen,
  onCloseHelp,
}: PlacementModalsProps) {
  return (
    <>
      <PlacementTasksModal
        isOpen={isTasksModalOpen}
        onClose={onCloseTasksModal}
        tasks={tasks}
        onTaskAction={onTaskAction}
      />

      {/* Publish confirm: to entities first, then to students */}
      <Dialog open={publishMode !== null} onOpenChange={(open) => !open && onClosePublishConfirm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{publishMode === "entities" ? "Publish to entities?" : "Publish to students?"}</DialogTitle>
            <DialogDescription>
              {publishMode === "entities"
                ? "The entities will see which students are placed on them. Detach and reassign actions will be locked. Use Edit to unlock them. Students cannot see anything yet."
                : "Each student will be told their placement and can see the information in the preview. The assignments become booked. You can edit later and send updates."}
            </DialogDescription>
          </DialogHeader>
          {needsMentorCount > 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {needsMentorCount} student{needsMentorCount === 1 ? " has" : "s have"} no mentor yet. You can publish anyway
              and assign mentors later.
            </p>
          )}
          {publishMode === "students" && infoWarnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs font-semibold text-amber-900">Information students will not get</p>
              <ul className="mt-1 max-h-24 space-y-0.5 overflow-y-auto text-xs text-amber-800">
                {infoWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {publishMode === "entities" && notifyList.length > 0 && (
            <div className="rounded-md border border-gray-200 px-3 py-2">
              <p className="text-xs font-semibold text-gray-700">Will be notified</p>
              <p className="text-[11px] text-gray-500">Marked "told on placement" on the entities. Nothing is sent in this prototype.</p>
              <ul className="mt-1 max-h-28 space-y-0.5 overflow-y-auto text-sm text-gray-700">
                {notifyList.map((n) => (
                  <li key={n.key}>
                    {n.name} <span className="text-xs text-gray-500">· {n.profileName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClosePublishConfirm}>
              Cancel
            </Button>
            <Button
              className={publishMode === "students" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white"}
              onClick={onPublishConfirm}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {publishMode === "entities" ? "Publish to entities" : "Publish to students"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quota selection dialog — assign a single student */}
      <Dialog
        open={isQuotaSelectionDialogOpen}
        onOpenChange={(open) => !open && onCloseQuotaSelection()}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Praksis Place</DialogTitle>
            <DialogDescription>
              Choose an entity for this emne for{" "}
              <span className="font-semibold">{selectedStudent?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {availableQuotaRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No entity with free places for this emne</p>
                <p className="text-xs mt-1">
                  Add a profile or raise its places under Praksis places → Profiles
                </p>
              </div>
            ) : (
              availableQuotaRequests.map((request) => {
                const units = request.units ?? [
                  { id: request.departmentId, name: request.departmentName, depth: 0 },
                ];
                // Earlier placements of this student at the same place and unit
                const historyFor = (unitName: string) =>
                  (selectedStudent?.placementHistory ?? []).filter(
                    (h) =>
                      h.praksisPlaceName?.toLowerCase() ===
                        request.praksisPlaceName.toLowerCase() &&
                      h.unitName?.toLowerCase() === unitName.toLowerCase(),
                  );

                return (
                  <div
                    key={request.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          <span className="font-medium text-gray-900 truncate">
                            {request.departmentName
                              ? `${request.praksisPlaceName} · ${request.departmentName}`
                              : request.praksisPlaceName}
                          </span>
                        </div>
                        {request.periodLabel && (
                          <div className="flex items-center gap-1 ml-6 mt-1 text-xs text-gray-500">
                            <CalendarIcon className="h-3 w-3" />
                            {request.periodLabel}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 border-green-200 flex-shrink-0"
                      >
                        {request.availableCount} available
                      </Badge>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {units.map((unit) => {
                        const history = historyFor(unit.name);
                        const full = unit.remaining === 0;
                        return (
                          <button
                            key={unit.profileId ?? unit.id}
                            onClick={() => {
                              if (!selectedStudent) return;
                              // Places never block a placement: a full entity can still take the student
                              toast.success(
                                `Assigned ${selectedStudent.name} to ${unit.profileName ?? unit.name}${full ? ` (over by ${(unit.over ?? 0) + 1})` : ""}`,
                              );
                              onAssignStudentToQuota(
                                selectedStudent.id,
                                request.praksisPlaceId,
                                unit.id,
                                unit.profileId ?? request._profileId,
                                unit.id,
                              );
                            }}
                            className={`w-full text-left py-2 pr-4 text-sm transition-colors ${
                              full
                                ? "bg-gray-50 hover:bg-amber-50"
                                : history.length > 0
                                  ? "bg-amber-50 hover:bg-amber-100"
                                  : "hover:bg-blue-50"
                            }`}
                            style={{ paddingLeft: `${16 + unit.depth * 20}px` }}
                            title={
                              full
                                ? `Full: no places left on ${unit.limitingName ?? "the entity"}. The student can still be placed here (over by ${(unit.over ?? 0) + 1}).`
                                : history.length > 0
                                  ? `${selectedStudent?.name} was placed here before`
                                  : undefined
                            }
                          >
                            <span className="flex items-center gap-1.5">
                              {history.length > 0 && (
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                              )}
                              <span className={unit.depth === 0 ? "font-medium text-gray-900" : "text-gray-700"}>
                                {unit.profileName ?? unit.name}
                              </span>
                              {unit.profileName && !unit.profileName.includes(unit.name) && (
                                <span className="text-xs text-gray-500">{unit.name}</span>
                              )}
                              {unit.remaining !== undefined && (
                                <span className={`ml-auto flex-shrink-0 text-xs ${full ? "text-amber-700" : "text-green-700"}`}>
                                  {full ? ((unit.over ?? 0) > 0 ? `Full · ${unit.over} over` : "Full") : `${unit.remaining} left`}
                                </span>
                              )}
                            </span>
                            {history.length > 0 && (
                              <span className="block text-xs text-amber-700 mt-0.5">
                                {history
                                  .map((h) => [h.year, h.semester, h.emne].filter(Boolean).join(" / "))
                                  .join(", ")}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AISupportSidebar
        isOpen={isAISidebarOpen}
        onClose={onCloseAISidebar}
        onExecuteAction={onAIAction}
        availableDepartments={availableDepartments}
        students={aiStudents}
        tasks={aiTasks}
        currentTaskIndex={aiCurrentTaskIndex}
      />

      <PlacementNetworkDiagramModal
        isOpen={isNetworkDiagramOpen}
        onClose={onCloseNetworkDiagram}
        students={networkDiagramStudents}
        quotas={networkDiagramQuotas}
        placementTitle={placementTitle}
        onAssignStudent={onNetworkAssignStudent}
        onUnassignStudent={onNetworkUnassignStudent}
      />

      <PlacementTaskHelpOverlay
        isOpen={isHelpOverlayOpen}
        onClose={onCloseHelp}
      />
    </>
  );
}
