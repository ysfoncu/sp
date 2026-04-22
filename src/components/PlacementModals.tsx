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
import { RequestQuotaModal } from "./RequestQuotaModal";
import { PlacementTaskHelpOverlay } from "./PlacementTaskHelpOverlay";
import { Student, PlacementTask } from "../types/placementTask";
import { PraksisPlace } from "../types/praksisPlace";
import { CoordinatorQuotaRequest } from "../types/coordinatorQuotaRequest";
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

interface RequestQuotaPlacementData {
  id: string;
  studyId: string;
  studyName: string;
  programId: string;
  programName: string;
  universityId: string;
  universityName: string;
  startDate: string;
  endDate: string;
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

  // Request quota modal
  isRequestQuotaModalOpen: boolean;
  editingQuotaRequest: CoordinatorQuotaRequest | null;
  requestQuotaPlacementData: RequestQuotaPlacementData;
  existingQuotasForRequest: Array<{
    praksisPlaceId: string;
    praksisPlaceName: string;
    departmentId: string;
    departmentName: string;
  }>;
  currentUserName: string;
  coordinatorQuotaRequestsForPlacement: CoordinatorQuotaRequest[];
  nodeSlots?: Record<string, Record<string, number>>;
  onCloseRequestQuota: () => void;
  onRequestQuotaSubmit: (
    data: Omit<CoordinatorQuotaRequest, "id" | "requestedDate" | "status">,
  ) => void;
  onUpdateQuotaRequest: (
    id: string,
    updates: Partial<CoordinatorQuotaRequest>,
  ) => void;

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
  isRequestQuotaModalOpen,
  editingQuotaRequest,
  requestQuotaPlacementData,
  existingQuotasForRequest,
  currentUserName,
  coordinatorQuotaRequestsForPlacement,
  nodeSlots = {},
  onCloseRequestQuota,
  onRequestQuotaSubmit,
  onUpdateQuotaRequest,
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
              Choose an available quota request to assign{" "}
              <span className="font-semibold">{selectedStudent?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {availableQuotaRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ClipboardCheck className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">No available quota requests found</p>
                <p className="text-xs mt-1">
                  Request quotas from the Capacity Planning page first
                </p>
              </div>
            ) : (
              availableQuotaRequests.map((request) => {
                const conflictHistory = (
                  selectedStudent?.placementHistory ?? []
                ).filter(
                  (h) =>
                    h.praksisPlaceName?.toLowerCase() ===
                      request.praksisPlaceName.toLowerCase() &&
                    h.unitName?.toLowerCase() ===
                      request.departmentName.toLowerCase(),
                );
                const hasConflict = conflictHistory.length > 0;

                return (
                  <button
                    key={request.id}
                    onClick={() => {
                      if (selectedStudent) {
                        toast.success(
                          `Assigned ${selectedStudent.name} to ${request.praksisPlaceName} - ${request.departmentName}`,
                        );
                        onAssignStudentToQuota(
                          selectedStudent.id,
                          request.praksisPlaceId,
                          request.departmentId,
                          request._quotaRequestId,
                          request._entityId,
                        );
                      }
                    }}
                    className={`w-full p-4 border rounded-lg transition-all text-left group ${
                      hasConflict
                        ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                        : "border-gray-200 hover:border-blue-500 hover:bg-blue-50"
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
                            {new Date(request.startDate).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" },
                            )}{" "}
                            -{" "}
                            {new Date(request.endDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>

                        {hasConflict && (
                          <div className="mt-2 ml-6 space-y-1">
                            {conflictHistory.map((h) => {
                              const statusColor =
                                h.status === "current"
                                  ? "border-l-blue-400 bg-blue-50 text-blue-700"
                                  : h.status === "upcoming"
                                    ? "border-l-green-400 bg-green-50 text-green-700"
                                    : "border-l-amber-400 bg-amber-100 text-amber-800";
                              const label =
                                h.status === "current"
                                  ? "Current"
                                  : h.status === "upcoming"
                                    ? "Upcoming"
                                    : "Previous";
                              const topLine = [h.year, h.semester, h.emne]
                                .filter(Boolean)
                                .join(" / ");
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
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {request.availableCount} available
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {request.assignedCount} /{" "}
                          {request.approvedCapacity ?? request.requestedCapacity}{" "}
                          assigned
                        </span>
                      </div>
                    </div>
                  </button>
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

      <RequestQuotaModal
        isOpen={isRequestQuotaModalOpen}
        onClose={onCloseRequestQuota}
        onSubmit={onRequestQuotaSubmit}
        placement={requestQuotaPlacementData}
        existingQuotas={existingQuotasForRequest}
        praksisPlaces={praksisPlaces}
        currentUserName={currentUserName}
        existingRequests={coordinatorQuotaRequestsForPlacement}
        editingRequest={editingQuotaRequest || undefined}
        onUpdate={onUpdateQuotaRequest}
        nodeSlots={nodeSlots}
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
