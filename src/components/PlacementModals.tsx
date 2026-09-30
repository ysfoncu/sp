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
import { QuickAssignStudentsModal } from "./QuickAssignStudentsModal";
import { SlideOverManageQuota, QuotaSelection } from "./SlideOverManageQuota";
import { AISupportSidebar } from "./AISupportSidebar";
import { FirstPublishModal } from "./FirstPublishModal";
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
  _quotaRequestId: string;
  _entityId?: string;
  // Limits: the units a student can be placed in, with the places left there (smallest remainder
  // over the limits on the unit's path) and the limit that sets it
  units?: Array<{ id: string; name: string; depth: number; remaining?: number; limitingName?: string }>;
  periodLabel?: string;
}

interface SelectedQuotaForAssignment {
  requestId: string;
  praksisPlaceId: string;
  praksisPlaceName: string;
  departmentId: string;
  departmentName: string;
  availableCapacity: number;
  entityId?: string;
}

interface NetworkDiagramStudent {
  id: string;
  name: string;
  assignedPlace?: {
    placeId: string;
    placeName: string;
    departmentId: string;
    departmentName: string;
    quotaRequestId?: string;
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
  isPublishConfirmOpen: boolean;
  onClosePublishConfirm: () => void;
  onPublishConfirm: () => void;

  // Quick assign modal (from quota table)
  isQuickAssignModalOpen: boolean;
  selectedQuotaForAssignment: SelectedQuotaForAssignment | null;
  unassignedStudents: Student[];
  priorityApplications?: PriorityPlacementApplication[];
  onCloseQuickAssign: () => void;
  onQuickAssignConfirm: (studentIds: string[]) => void;

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

  // Manage quota slide-over
  isManageQuotaModalOpen: boolean;
  praksisPlaces: PraksisPlace[];
  existingQuotas: QuotaSelection[];
  onCloseManageQuota: () => void;
  onSaveQuotas: (quotas: QuotaSelection[]) => void;

  // AI support sidebar
  isAISidebarOpen: boolean;
  onCloseAISidebar: () => void;
  onAIAction: (action: string, data: any) => void;
  availableDepartments: any[];
  aiStudents: Student[];
  aiTasks: Array<{ id: string; title: string; completed: boolean }>;
  aiCurrentTaskIndex: number;

  // First publish modal
  isFirstPublishModalOpen: boolean;
  onCloseFirstPublish: () => void;
  onFirstPublish: (deadline: string, message: string) => void;

  // Publish warning dialog
  showPublishWarning: boolean;
  onClosePublishWarning: () => void;

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
    quotaRequestId?: string,
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
  isPublishConfirmOpen,
  onClosePublishConfirm,
  onPublishConfirm,
  isQuickAssignModalOpen,
  selectedQuotaForAssignment,
  unassignedStudents,
  priorityApplications,
  onCloseQuickAssign,
  onQuickAssignConfirm,
  isQuotaSelectionDialogOpen,
  selectedStudent,
  availableQuotaRequests,
  onCloseQuotaSelection,
  onAssignStudentToQuota,
  isManageQuotaModalOpen,
  praksisPlaces,
  existingQuotas,
  onCloseManageQuota,
  onSaveQuotas,
  isAISidebarOpen,
  onCloseAISidebar,
  onAIAction,
  availableDepartments,
  aiStudents,
  aiTasks,
  aiCurrentTaskIndex,
  isFirstPublishModalOpen,
  onCloseFirstPublish,
  onFirstPublish,
  showPublishWarning,
  onClosePublishWarning,
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

      {/* Publish assignments confirm */}
      <Dialog open={isPublishConfirmOpen} onOpenChange={(open) => !open && onClosePublishConfirm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish assignments?</DialogTitle>
            <DialogDescription>
              Publishing will lock all student assignments. Detach and reassign
              actions will be disabled and quota request actions will be
              read-only. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClosePublishConfirm}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={onPublishConfirm}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Publish assignments
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick assign modal — from Available Quotas Table */}
      {selectedQuotaForAssignment && (
        <QuickAssignStudentsModal
          isOpen={isQuickAssignModalOpen}
          onClose={onCloseQuickAssign}
          praksisPlaceName={selectedQuotaForAssignment.praksisPlaceName}
          departmentName={selectedQuotaForAssignment.departmentName}
          availableCapacity={selectedQuotaForAssignment.availableCapacity}
          unassignedStudents={unassignedStudents}
          priorityApplications={priorityApplications}
          onAssign={onQuickAssignConfirm}
        />
      )}

      {/* Quota selection dialog — assign a single student */}
      <Dialog
        open={isQuotaSelectionDialogOpen}
        onOpenChange={(open) => !open && onCloseQuotaSelection()}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Praksis Place</DialogTitle>
            <DialogDescription>
              Choose a unit covered by one of this emne's limits for{" "}
              <span className="font-semibold">{selectedStudent?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {availableQuotaRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No limit with free places for this emne</p>
                <p className="text-xs mt-1">
                  Add or raise a limit for this emne under Praksis places → Limits
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
                            key={unit.id}
                            disabled={full}
                            onClick={() => {
                              if (!selectedStudent) return;
                              toast.success(
                                `Assigned ${selectedStudent.name} to ${request.praksisPlaceName} - ${unit.name}`,
                              );
                              onAssignStudentToQuota(
                                selectedStudent.id,
                                request.praksisPlaceId,
                                unit.id,
                                request._quotaRequestId,
                                unit.id,
                              );
                            }}
                            className={`w-full text-left py-2 pr-4 text-sm transition-colors ${
                              full
                                ? "cursor-not-allowed opacity-50"
                                : history.length > 0
                                  ? "bg-amber-50 hover:bg-amber-100"
                                  : "hover:bg-blue-50"
                            }`}
                            style={{ paddingLeft: `${16 + unit.depth * 20}px` }}
                            title={
                              full
                                ? `Full: ${unit.limitingName ?? "the"} limit reached`
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
                                {unit.name}
                              </span>
                              {unit.remaining !== undefined && (
                                <span className={`ml-auto flex-shrink-0 text-xs ${full ? "text-gray-400" : "text-green-700"}`}>
                                  {full ? "Full" : `${unit.remaining} left`}
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

      <SlideOverManageQuota
        isOpen={isManageQuotaModalOpen}
        onClose={onCloseManageQuota}
        praksisPlaces={praksisPlaces}
        onSaveQuotas={onSaveQuotas}
        existingQuotas={existingQuotas}
      />

      <AISupportSidebar
        isOpen={isAISidebarOpen}
        onClose={onCloseAISidebar}
        onExecuteAction={onAIAction}
        availableDepartments={availableDepartments}
        students={aiStudents}
        tasks={aiTasks}
        currentTaskIndex={aiCurrentTaskIndex}
      />

      <FirstPublishModal
        isOpen={isFirstPublishModalOpen}
        onClose={onCloseFirstPublish}
        onPublish={onFirstPublish}
      />

      {/* Publish warning — shown when trying to assign before first publish */}
      <Dialog open={showPublishWarning} onOpenChange={(open) => !open && onClosePublishWarning()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Placement First</DialogTitle>
            <DialogDescription className="text-base pt-2">
              You should publish placement to collect custom requests from
              students. Use publish button located above.
              <br />
              <br />
              <strong>Note:</strong> This is the default workflow for demo. In
              real app you will be able to change the workflow.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={onClosePublishWarning}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
